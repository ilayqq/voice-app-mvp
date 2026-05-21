package mapper

import (
	"voice-app/domain"
	"voice-app/dto"
)

func MapUserToDTO(user domain.User) dto.UserResponse {
	roleNames := make([]string, len(user.Roles))

	for i, role := range user.Roles {
		roleNames[i] = role.Name
	}

	return dto.UserResponse{
		ID:          user.ID,
		FullName:    user.FullName,
		PhoneNumber: *user.PhoneNumber,
		Email:       user.Email,
		Picture:     user.Picture,
		RoleName:    roleNames,
	}
}

func MapUsersToDTO(users []domain.User) []dto.UserResponse {
	userDTOs := make([]dto.UserResponse, len(users))
	for i, user := range users {
		userDTOs[i] = MapUserToDTO(user)
	}
	return userDTOs
}
