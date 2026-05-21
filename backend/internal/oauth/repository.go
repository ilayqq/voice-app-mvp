package oauth

import (
	"context"
	"errors"
	"fmt"
	"voice-app/domain"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type Repository interface {
	FindByProvider(ctx context.Context, provider, providerId string) (*domain.OAuthAccount, error)
	Create(ctx context.Context, account *domain.OAuthAccount) (*domain.OAuthAccount, error)
}

type repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) Repository {
	return &repository{db: db}
}

func (r *repository) FindByProvider(ctx context.Context, provider, providerId string) (*domain.OAuthAccount, error) {
	var account domain.OAuthAccount
	err := r.db.WithContext(ctx).Where("provider = ? AND provider_id = ?", provider, providerId).First(&account).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}

	if err != nil {
		return nil, fmt.Errorf("find oauth account: %w", err)
	}
	return &account, nil
}

func (r *repository) Create(ctx context.Context, account *domain.OAuthAccount) (*domain.OAuthAccount, error) {
	err := r.db.WithContext(ctx).
		Clauses(clause.OnConflict{
			Columns: []clause.Column{
				{Name: "provider"},
				{Name: "provider_id"},
			},
			DoUpdates: clause.AssignmentColumns([]string{
				"user_id",
				"email",
				"access_token",
				"refresh_token",
				"updated_at",
			}),
		}).
		Create(account).Error

	if err != nil {
		return nil, fmt.Errorf("create oauth account: %w", err)
	}
	return account, nil
}
