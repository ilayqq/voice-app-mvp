package auth

import (
	"errors"
	"regexp"
	"voice-app/domain"
	"voice-app/internal/company"
	"voice-app/internal/mapper"
	"voice-app/internal/user"
	"voice-app/dto"

	"golang.org/x/crypto/bcrypt"
)

type Service interface {
	Register(phoneNumber, password, fullName, companyName string) (*dto.AuthRegisterResponse, error)
	Login(phoneNumber, password string) (*dto.AuthLoginResponse, error)
}

type service struct {
	userRepo    user.Repository
	companySvc  company.Service
}

func NewService(userRepo user.Repository, companySvc company.Service) Service {
	return &service{userRepo: userRepo, companySvc: companySvc}
}

func (s *service) Register(phoneNumber, password, fullName, companyName string) (*dto.AuthRegisterResponse, error) {
	re := regexp.MustCompile(`^\+?\d[\d\s\-]{9,14}\d$`)
	if !re.MatchString(phoneNumber) {
		return nil, errors.New("invalid phone number format")
	}
	if companyName == "" {
		return nil, errors.New("company name is required")
	}

	existingUser, err := s.userRepo.Exist(phoneNumber)
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

	phone := phoneNumber
	u := &domain.User{
		FullName:    fullName,
		PhoneNumber: &phone,
		Password:    string(hash),
		Roles:       []domain.Role{{Name: "owner"}},
	}

	if err := s.userRepo.Create(u); err != nil {
		return nil, err
	}

	comp, err := s.companySvc.SetupCompanyForOwner(u.ID, companyName, fullName)
	if err != nil {
		return nil, err
	}

	token, err := GenerateToken(u, &TokenData{
		CompanyID:   comp.ID,
		CompanyRole: domain.CompanyRoleOwner,
	})
	if err != nil {
		return nil, err
	}

	userDTO := mapper.MapUserToDTO(*u)
	return &dto.AuthRegisterResponse{
		Token:   token,
		User:    userDTO,
		Company: dto.CompanyResponse{ID: comp.ID, Name: comp.Name, Role: domain.CompanyRoleOwner},
	}, nil
}

func (s *service) Login(phoneNumber, password string) (*dto.AuthLoginResponse, error) {
	u, err := s.userRepo.GetByPhoneNumber(phoneNumber)
	if err != nil {
		return nil, errors.New("user not found")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password)); err != nil {
		return nil, errors.New("invalid credentials")
	}

	member, err := s.companySvc.GetMembership(u.ID)
	if err != nil {
		return nil, errors.New("user is not assigned to any company")
	}

	token, err := GenerateToken(u, &TokenData{
		CompanyID:   member.CompanyID,
		CompanyRole: member.Role,
	})
	if err != nil {
		return nil, err
	}

	userDTO := mapper.MapUserToDTO(*u)
	return &dto.AuthLoginResponse{
		Token: token,
		User:  userDTO,
		Company: dto.CompanyResponse{
			ID:   member.CompanyID,
			Name: member.Company.Name,
			Role: member.Role,
		},
	}, nil
}
