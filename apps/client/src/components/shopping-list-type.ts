export interface ListItemType {
  id: string
  quantity: number
  isCompleted: boolean
  notes?: string
  addedAt: string
  updatedAt?: string
  item: {
    id: string
    name: string
    category?: string
  }
}
