package dto

type CompanyResponse struct {
	ID   uint   `json:"id"`
	Name string `json:"name"`
	Role string `json:"role"`
}

type CompanyMemberResponse struct {
	ID          uint   `json:"id"`
	UserID      uint   `json:"user_id"`
	FullName    string `json:"full_name"`
	PhoneNumber string `json:"phone_number"`
	Role        string `json:"role"`
}

type AddEmployeeRequest struct {
	PhoneNumber string `json:"phone_number" binding:"required"`
	Role        string `json:"role" binding:"required"`
}

type UpdateEmployeeRoleRequest struct {
	Role string `json:"role" binding:"required"`
}
