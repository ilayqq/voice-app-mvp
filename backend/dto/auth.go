package dto

type AuthLoginResponse struct {
	Token   string          `json:"token"`
	User    UserResponse    `json:"user"`
	Company CompanyResponse `json:"company"`
}

type AuthRegisterResponse struct {
	Token   string          `json:"token"`
	User    UserResponse    `json:"user"`
	Company CompanyResponse `json:"company"`
}
