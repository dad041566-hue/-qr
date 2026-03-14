export type UserRole = 'owner' | 'manager' | 'staff'

export interface StoreUser {
  id: string
  email: string
  role: UserRole
  storeId: string
  storeName: string
}
