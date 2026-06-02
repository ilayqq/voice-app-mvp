import API_CONFIG from '../config/api'
import type {
  Product,
  InventoryItem,
  Operation,
  StockMovementRequest,
  StockMovementResponse,
  AnalyticsSummary,
} from '../types'

export interface LoginRequest {
  phone_number: string
  password: string
}

export interface RegisterRequest {
  phone_number: string
  password: string
  full_name?: string
  company_name: string
}

export interface CompanyInfo {
  id: number
  name: string
  role: 'owner' | 'manager' | 'employee'
}

export interface UserInfo {
  id: number
  full_name?: string
  phone_number: string
  roles?: string[]
  company?: CompanyInfo
}

export interface AuthResponse {
  token: string
  user: UserInfo
  company: CompanyInfo
}

export interface CompanyEmployee {
  id: number
  user_id: number
  full_name: string
  phone_number: string
  role: string
}

export interface AddEmployeeRequest {
  phone_number: string
  password: string
  full_name?: string
  role: 'manager' | 'employee'
}

export interface UpdateUserRequest {
  full_name?: string
  phone_number?: string
}

export interface ChangePasswordRequest {
  current_password: string
  new_password: string
}

class ApiClient {
  private get baseURL(): string {
    return API_CONFIG.getBaseURL()
  }

  private get apiURL(): string {
    return API_CONFIG.getAuthBaseURL()
  }

  private getHeaders(includeAuth = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    if (includeAuth) {
      const token = localStorage.getItem('auth_token')
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
    }
    return headers
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Ошибка сервера' }))
      throw new Error(error.message || error.error || `HTTP error! status: ${response.status}`)
    }
    return response.json()
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${this.apiURL}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify(data),
    })
    return this.handleResponse<AuthResponse>(response)
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await fetch(`${this.apiURL}/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify(data),
    })
    return this.handleResponse<AuthResponse>(response)
  }

  async getCompany(): Promise<CompanyInfo> {
    const response = await fetch(`${this.baseURL}/company/me`, {
      headers: this.getHeaders(),
    })
    return this.handleResponse<CompanyInfo>(response)
  }

  async getEmployees(): Promise<CompanyEmployee[]> {
    const response = await fetch(`${this.baseURL}/company/employees`, {
      headers: this.getHeaders(),
    })
    return this.handleResponse<CompanyEmployee[]>(response)
  }

  async addEmployee(data: AddEmployeeRequest): Promise<CompanyEmployee> {
    const response = await fetch(`${this.baseURL}/company/employees`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    })
    return this.handleResponse<CompanyEmployee>(response)
  }

  async updateEmployeeRole(memberId: number, role: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/company/employees/${memberId}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ role }),
    })
    await this.handleResponse(response)
  }

  async removeEmployee(memberId: number): Promise<void> {
    const response = await fetch(`${this.baseURL}/company/employees/${memberId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Ошибка сервера' }))
      throw new Error(error.message || error.error || `HTTP error! status: ${response.status}`)
    }
  }

  async getUserByPhone(phone_number: string): Promise<UserInfo> {
    const response = await fetch(`${this.baseURL}/users?phone_number=${encodeURIComponent(phone_number)}`, {
      headers: this.getHeaders(),
    })
    return this.handleResponse<UserInfo>(response)
  }

  async updateUser(data: UpdateUserRequest): Promise<UserInfo> {
    const response = await fetch(`${this.baseURL}/users`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    })
    return this.handleResponse<UserInfo>(response)
  }

  async changePassword(data: ChangePasswordRequest): Promise<void> {
    const response = await fetch(`${this.baseURL}/users/password`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    })
    await this.handleResponse(response)
  }

  async uploadProductImage(file: File): Promise<string> {
    const fd = new FormData()
    fd.append('file', file)
    const headers = this.getHeaders()
    if (headers instanceof Headers) {
      headers.delete('Content-Type')
    } else if (typeof headers === 'object' && 'Content-Type' in headers) {
      delete (headers as Record<string, string>)['Content-Type']
    }
    const response = await fetch(`${this.baseURL}/products/upload-image`, {
      method: 'POST',
      headers,
      body: fd,
    })
    const data = await this.handleResponse<{ image_url: string }>(response)
    return data.image_url
  }

  async getProducts(): Promise<Product[]> {
    const response = await fetch(`${this.baseURL}/products`, {
      headers: this.getHeaders(true),
    })
    return this.handleResponse<Product[]>(response)
  }

  async getProductByBarcode(barcode: string): Promise<Product | null> {
    const response = await fetch(`${this.baseURL}/products?barcode=${barcode}`, {
      headers: this.getHeaders(true),
    })
    return this.handleResponse<Product | null>(response)
  }

  async createProduct(product: Product): Promise<Product> {
    const response = await fetch(`${this.baseURL}/products`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(product),
    })
    return this.handleResponse<Product>(response)
  }

  async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    const response = await fetch(`${this.baseURL}/products?barcode=${id}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(product),
    })
    return this.handleResponse<Product>(response)
  }

  async deleteProduct(barcode: string | undefined): Promise<void> {
    const response = await fetch(`${this.baseURL}/products?barcode=${barcode}`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    })
    if (!response.ok) {
      throw new Error('Ошибка удаления товара')
    }
  }

  async getInventory(): Promise<InventoryItem[]> {
    const response = await fetch(`${this.baseURL}/inventory`, {
      headers: this.getHeaders(),
    })
    return this.handleResponse<InventoryItem[]>(response)
  }

  async updateInventory(items: InventoryItem[]): Promise<InventoryItem[]> {
    const response = await fetch(`${this.baseURL}/inventory`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ items }),
    })
    return this.handleResponse<InventoryItem[]>(response)
  }

  async getOperations(): Promise<Operation[]> {
    const response = await fetch(`${this.baseURL}/operations`, {
      headers: this.getHeaders(),
    })
    return this.handleResponse<Operation[]>(response)
  }

  async createOperation(operation: Omit<Operation, 'id'>): Promise<Operation> {
    const response = await fetch(`${this.baseURL}/operations`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(operation),
    })
    return this.handleResponse<Operation>(response)
  }

  async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    const response = await fetch(`${this.baseURL}/analytics/summary`, {
      headers: this.getHeaders(),
    })
    return this.handleResponse<AnalyticsSummary>(response)
  }

  async getStockMovements(): Promise<StockMovementResponse[]> {
    const response = await fetch(`${this.baseURL}/stock-movements`, {
      headers: this.getHeaders(),
    })
    return this.handleResponse<StockMovementResponse[]>(response)
  }

  async createStockMovement(data: StockMovementRequest): Promise<StockMovementResponse> {
    const response = await fetch(`${this.baseURL}/stock-movements`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    })
    return this.handleResponse<StockMovementResponse>(response)
  }

  async uploadVoice(blob: Blob): Promise<{ text?: string }> {
    const fd = new FormData()
    fd.append('file', blob, 'voice.wav')
    const headers = this.getHeaders()
    if (headers instanceof Headers) {
      headers.delete('Content-Type')
    } else if (typeof headers === 'object' && 'Content-Type' in headers) {
      delete (headers as Record<string, string>)['Content-Type']
    }
    const response = await fetch(`${this.baseURL}/voice/upload`, {
      method: 'POST',
      headers: headers,
      body: fd,
    })
    return this.handleResponse(response)
  }
}

export const apiClient = new ApiClient()
export default apiClient