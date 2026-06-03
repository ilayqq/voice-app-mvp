package company

import (
	"errors"
	"regexp"
	"voice-app/domain"
	"voice-app/dto"
	"voice-app/internal/user"

	"gorm.io/gorm"
)

var validEmployeeRoles = map[string]bool{
	domain.CompanyRoleManager:  true,
	domain.CompanyRoleEmployee: true,
}

type Service interface {
	GetMyCompany(userID uint) (*dto.CompanyResponse, error)
	ListEmployees(companyID uint) ([]dto.CompanyMemberResponse, error)
	AddEmployee(companyID, ownerID uint, req dto.AddEmployeeRequest) (*dto.CompanyMemberResponse, error)
	UpdateEmployeeRole(companyID, memberID uint, role string) error
	RemoveEmployee(companyID, memberID uint) error
	GetMembership(userID uint) (*domain.CompanyMember, error)
	SetupCompanyForOwner(userID uint, companyName, fullName string) (*domain.Company, error)
}

type service struct {
	repo     Repository
	userRepo user.Repository
}

func NewService(repo Repository, userRepo user.Repository) Service {
	return &service{repo: repo, userRepo: userRepo}
}

func (s *service) GetMyCompany(userID uint) (*dto.CompanyResponse, error) {
	member, err := s.repo.GetMemberByUserID(userID)
	if err != nil {
		return nil, errors.New("company not found")
	}
	return &dto.CompanyResponse{
		ID:   member.CompanyID,
		Name: member.Company.Name,
		Role: member.Role,
	}, nil
}

func (s *service) ListEmployees(companyID uint) ([]dto.CompanyMemberResponse, error) {
	members, err := s.repo.GetMembersByCompanyID(companyID)
	if err != nil {
		return nil, err
	}
	result := make([]dto.CompanyMemberResponse, len(members))
	for i, m := range members {
		phone := ""
		if m.User.PhoneNumber != nil {
			phone = *m.User.PhoneNumber
		}
		result[i] = dto.CompanyMemberResponse{
			ID:          m.ID,
			UserID:      m.UserID,
			FullName:    m.User.FullName,
			PhoneNumber: phone,
			Role:        m.Role,
		}
	}
	return result, nil
}

func (s *service) AddEmployee(companyID, ownerID uint, req dto.AddEmployeeRequest) (*dto.CompanyMemberResponse, error) {
	if !validEmployeeRoles[req.Role] {
		return nil, errors.New("invalid role: use manager or employee")
	}

	re := regexp.MustCompile(`^\+?\d[\d\s\-]{9,14}\d$`)
	if !re.MatchString(req.PhoneNumber) {
		return nil, errors.New("invalid phone number format")
	}

	u, err := s.userRepo.GetByPhoneNumber(req.PhoneNumber)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, errors.New("user with this phone number is not registered")
	}
	if err != nil {
		return nil, err
	}

	existing, _ := s.repo.GetMemberByUserID(u.ID)
	if existing != nil {
		if existing.CompanyID == companyID {
			return nil, errors.New("user is already a member of this company")
		}
		return nil, errors.New("user already belongs to another company")
	}

	member := &domain.CompanyMember{
		CompanyID: companyID,
		UserID:    u.ID,
		Role:      req.Role,
	}
	if err := s.repo.CreateMember(member); err != nil {
		return nil, err
	}

	phone := ""
	if u.PhoneNumber != nil {
		phone = *u.PhoneNumber
	}
	return &dto.CompanyMemberResponse{
		ID:          member.ID,
		UserID:      u.ID,
		FullName:    u.FullName,
		PhoneNumber: phone,
		Role:        member.Role,
	}, nil
}

func (s *service) UpdateEmployeeRole(companyID, memberID uint, role string) error {
	if role == domain.CompanyRoleOwner {
		return errors.New("cannot assign owner role")
	}
	if !validEmployeeRoles[role] {
		return errors.New("invalid role")
	}

	members, err := s.repo.GetMembersByCompanyID(companyID)
	if err != nil {
		return err
	}
	var target *domain.CompanyMember
	for i := range members {
		if members[i].ID == memberID {
			target = &members[i]
			break
		}
	}
	if target == nil {
		return errors.New("member not found")
	}
	if target.Role == domain.CompanyRoleOwner {
		return errors.New("cannot change owner role")
	}
	return s.repo.UpdateMemberRole(memberID, role)
}

func (s *service) RemoveEmployee(companyID, memberID uint) error {
	members, err := s.repo.GetMembersByCompanyID(companyID)
	if err != nil {
		return err
	}
	for _, m := range members {
		if m.ID == memberID {
			if m.Role == domain.CompanyRoleOwner {
				return errors.New("cannot remove company owner")
			}
			return s.repo.DeleteMember(memberID)
		}
	}
	return errors.New("member not found")
}

func (s *service) GetMembership(userID uint) (*domain.CompanyMember, error) {
	return s.repo.GetMemberByUserID(userID)
}

func (s *service) SetupCompanyForOwner(userID uint, companyName, fullName string) (*domain.Company, error) {
	company := &domain.Company{
		Name:    companyName,
		OwnerID: userID,
	}
	if err := s.repo.CreateCompany(company); err != nil {
		return nil, err
	}

	member := &domain.CompanyMember{
		CompanyID: company.ID,
		UserID:    userID,
		Role:      domain.CompanyRoleOwner,
	}
	if err := s.repo.CreateMember(member); err != nil {
		return nil, err
	}

	warehouse := &domain.Warehouse{
		CompanyID: company.ID,
		Name:      "Основной склад",
		OwnerID:   userID,
	}
	if err := s.repo.CreateWarehouse(warehouse); err != nil {
		return nil, err
	}

	if fullName != "" {
		u, err := s.userRepo.GetByID(userID)
		if err == nil {
			u.FullName = fullName
			_ = s.userRepo.Update(u)
		}
	}

	return company, nil
}
