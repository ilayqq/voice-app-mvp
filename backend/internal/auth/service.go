package auth

import (
	"errors"
	"regexp"
	"voice-app/domain"
	"voice-app/internal/user"

	"golang.org/x/crypto/bcrypt"
)

type Service interface {
	Register(phoneNumber, password string, roles []string) (*domain.User, error)
	Login(phoneNumber, password string) (string, error)
}
type service struct {
	repository user.Repository
}

func NewService(repository user.Repository) Service {
	return &service{repository: repository}
}

func (s *service) Register(phoneNumber, password string, roles []string) (*domain.User, error) {
	re := regexp.MustCompile(`^\+?\d[\d\s\-]{9,14}\d$`)
	if !re.MatchString(phoneNumber) {
		return nil, errors.New("invalid phone number format")
	}

	existingUser, err := s.repository.Exist(phoneNumber)
	if err != nil {
		return nil, err
	}

	if existingUser != nil {
		return nil, errors.New("user with this phone number already exists")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	u := &domain.User{
		PhoneNumber: &phoneNumber,
		Password:    string(hash),
		Roles:       make([]domain.Role, len(roles)),
	}

	for i, roleName := range roles {
		u.Roles[i] = domain.Role{Name: roleName}
	}

	if err := s.repository.Create(u); err != nil {
		return nil, err
	}

	return u, nil
}

func (s *service) Login(phoneNumber, password string) (string, error) {
	u, err := s.repository.GetByPhoneNumber(phoneNumber)
	if err != nil {
		return "", errors.New("user not found")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password)); err != nil {
		return "", errors.New("invalid credentials")
	}

	return GenerateToken(u)
}
