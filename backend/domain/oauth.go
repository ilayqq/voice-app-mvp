package domain

import "errors"

type GoogleUserInfo struct {
	Sub           string
	Email         string
	EmailVerified bool
	Name          string
	Picture       string
}

func (g *GoogleUserInfo) Validate() error {
	if g.Sub == "" {
		return errors.New("missing google sub")
	}
	if g.Email == "" {
		return errors.New("missing email")
	}
	if !g.EmailVerified {
		return errors.New("email not verified")
	}
	return nil
}

type OAuthAccount struct {
	ID           string
	UserID       string
	Provider     string
	ProviderID   string
	Email        string
	AccessToken  string
	RefreshToken string
	CreatedAt    string
	UpdatedAt    string
}

type AuthResult struct {
	AccessToken string `json:"access_token"`
	User        *User  `json:"user"`
}
