package oauth

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"voice-app/domain"
	"voice-app/internal/auth"
	"voice-app/internal/user"

	"golang.org/x/oauth2"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

const (
	googleUserInfoURL = "https://www.googleapis.com/oauth2/v3/userinfo"
	providerGoogle    = "google"
)

type Service interface {
	GetAuthURL() (url, state string, err error)
	GoogleCallback(ctx context.Context, code string) (*domain.AuthResult, error)
}

type service struct {
	oauthConfig *oauth2.Config
	userRepo    user.Repository
	oauthRepo   Repository
	db          *gorm.DB
}

func NewService(
	cfg *oauth2.Config,
	db *gorm.DB,
	userRepo user.Repository,
	oauthRepo Repository,
) Service {
	return &service{
		oauthConfig: cfg,
		db:          db,
		userRepo:    userRepo,
		oauthRepo:   oauthRepo,
	}
}

func (s *service) GetAuthURL() (string, string, error) {
	state, err := generateState()
	if err != nil {
		return "", "", fmt.Errorf("generate state: %w", err)
	}
	url := s.oauthConfig.AuthCodeURL(state, oauth2.AccessTypeOffline)
	return url, state, nil
}

func (s *service) GoogleCallback(ctx context.Context, code string) (*domain.AuthResult, error) {
	token, err := s.oauthConfig.Exchange(ctx, code)
	if err != nil {
		return nil, fmt.Errorf("exchange code: %w", err)
	}

	googleUser, err := s.fetchGoogleUser(ctx, token)
	if err != nil {
		return nil, fmt.Errorf("fetch google user: %w", err)
	}

	if err := googleUser.Validate(); err != nil {
		return nil, fmt.Errorf("invalid google user: %w", err)
	}

	domainUser, err := s.findOrCreateUser(googleUser, token)
	if err != nil {
		return nil, fmt.Errorf("find or create user: %w", err)
	}

	jwtToken, err := auth.GenerateToken(domainUser)
	if err != nil {
		return nil, fmt.Errorf("generate token: %w", err)
	}

	return &domain.AuthResult{
		AccessToken: jwtToken,
		User:        domainUser,
	}, nil
}

func (s *service) findOrCreateUser(g *domain.GoogleUserInfo, token *oauth2.Token) (*domain.User, error) {
	existing, err := s.oauthRepo.FindByProvider(context.Background(), providerGoogle, g.Sub)
	if err != nil {
		return nil, fmt.Errorf("find oauth account: %w", err)
	}

	if existing != nil {
		existing.AccessToken = token.AccessToken
		existing.RefreshToken = token.RefreshToken
		if _, err := s.oauthRepo.Create(context.Background(), existing); err != nil {
			return nil, fmt.Errorf("refresh access token: %w", err)
		}

		var u domain.User
		if err := s.db.Where("email = ?", g.Email).First(&u).Error; err != nil {
			return nil, fmt.Errorf("load user: %w", err)
		}

		return &u, nil
	}

	var result *domain.User

	err = s.db.Transaction(func(tx *gorm.DB) error {
		var u domain.User
		err := tx.Where("email = ?", g.Email).First(&u).Error
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return fmt.Errorf("find user by email: %w", err)
		}

		if errors.Is(err, gorm.ErrRecordNotFound) {
			email := g.Email
			u = domain.User{
				FullName: g.Name,
				Email:    &email,
				Picture:  g.Picture,
			}
			if err := tx.Create(&u).Error; err != nil {
				return fmt.Errorf("create user: %w", err)
			}
		}

		account := domain.OAuthAccount{
			UserID:       fmt.Sprint(u.ID),
			Provider:     providerGoogle,
			ProviderID:   g.Sub,
			Email:        g.Email,
			AccessToken:  token.AccessToken,
			RefreshToken: token.RefreshToken,
		}
		if err := tx.Clauses(clause.OnConflict{
			Columns: []clause.Column{{Name: "provider"}, {Name: "provider_id"}},
			DoUpdates: clause.AssignmentColumns([]string{
				"user_id", "email", "access_token", "refresh_token", "updated_at",
			}),
		}).Create(account).Error; err != nil {
			return fmt.Errorf("create oauth account: %w", err)
		}

		result = &u
		return nil
	})
	if err != nil {
		return nil, err
	}

	return result, nil
}

func (s *service) fetchGoogleUser(ctx context.Context, token *oauth2.Token) (*domain.GoogleUserInfo, error) {
	client := s.oauthConfig.Client(ctx, token)
	client.Timeout = 10

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, googleUserInfoURL, nil)
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("do request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("google api returned status: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return nil, fmt.Errorf("read response body: %w", err)
	}

	var userInfo domain.GoogleUserInfo
	if err := json.Unmarshal(body, &userInfo); err != nil {
		return nil, fmt.Errorf("decode user info: %w", err)
	}

	return &userInfo, nil
}

func generateState() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("read random bytes: %w", err)
	}
	return base64.URLEncoding.EncodeToString(b), nil
}
