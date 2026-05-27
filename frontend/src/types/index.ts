export interface ProductStock {
  id?: number
  warehouseID?: number
  productID?: number
  quantity: number
}

export interface Product {
  id?: number
  name: string
  barcode: string
  description?: string
  category?: string
  price?: number
  imageUrl?: string
  imageFile?: File
  createdAt?: string
  updatedAt?: string
  stocks?: ProductStock[]
}

export interface InventoryItem {
  productId: string
  quantity: number
  reserved: number
}

export interface Operation {
  id: string
  type: 'incoming' | 'outgoing'
  productId: string
  quantity: number
  date: string
  notes?: string
  userId?: string
}

export interface ProductWithInventory extends Product {
  quantity: number
  reserved: number
  available: number
}

export interface StockMovementRequest {
  product_id: number
  warehouse_id?: number
  type: 'incoming' | 'outgoing'
  quantity: number
  description?: string
}

export interface StockMovementResponse {
  id: number
  stock_id: number
  product_id: number
  product_name: string
  barcode: string
  warehouse_id: number
  type: string
  quantity: number
  description: string
  created_by_id: number
  created_at: string
}

