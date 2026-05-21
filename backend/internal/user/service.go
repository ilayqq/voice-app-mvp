package user

import (
	"voice-app/domain"
	"voice-app/dto"
)

type Service interface {
	GetAll() ([]domain.User, error)
	GetByPhoneNumber(phoneNumber string) (*domain.User, error)
	Update(phoneNumber string, req dto.UserRequest) (*domain.User, error)
}

type service struct {
	repository Repository
}

func NewService(repository Repository) Service { return &service{repository: repository} }

func (s *service) GetAll() ([]domain.User, error) {
	users, err := s.repository.GetAll()
	if err != nil {
		return nil, err
	}
	return users, nil
}

func (s *service) GetByPhoneNumber(phoneNumber string) (*domain.User, error) {
	user, err := s.repository.GetByPhoneNumber(phoneNumber)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (s *service) Update(phoneNumber string, req dto.UserRequest) (*domain.User, error) {
	user, err := s.repository.GetByPhoneNumber(phoneNumber)
	if err != nil {
		return nil, err
	}

	if req.FullName != nil {
		user.FullName = *req.FullName
	}
	if req.PhoneNumber != nil {
		user.PhoneNumber = req.PhoneNumber
	}
	if req.Email != nil {
		user.Email = req.Email
	}
	if req.Picture != nil {
		user.Picture = *req.Picture
	}

	if err := s.repository.Update(user); err != nil {
		return nil, err
	}
	return user, nil
}
