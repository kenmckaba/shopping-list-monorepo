import type { ListItemType } from '@/components/shopping-list-type'
import { Button } from '@/components/ui/button'

interface ListItemProps {
  listItem: ListItemType
  isCompleted: boolean
  idPrefix?: string
  transitioningItems: Set<string>
  onToggleComplete: (itemId: string, currentStatus: boolean) => void
  onRemoveItem: (itemId: string, itemName: string) => void
}

export function ListItem({
  listItem,
  isCompleted,
  idPrefix = 'item',
  transitioningItems,
  onToggleComplete,
  onRemoveItem,
}: ListItemProps) {
  return (
    <div
      className={`w-full p-2 shadow-sm transition-all duration-200 ${
        isCompleted
          ? 'bg-muted rounded-lg hover:bg-muted/80'
          : 'bg-card hover:bg-accent'
      }`}
    >
      <div className="flex items-center justify-between">
        <label
          htmlFor={`${idPrefix}-${listItem.id}`}
          className="flex items-center space-x-2 flex-1 cursor-pointer"
        >
          <input
            type="checkbox"
            id={`${idPrefix}-${listItem.id}`}
            name="itemCompleted"
            checked={
              isCompleted
                ? listItem.isCompleted && !transitioningItems.has(listItem.id)
                : listItem.isCompleted || transitioningItems.has(listItem.id)
            }
            onChange={() => onToggleComplete(listItem.id, listItem.isCompleted)}
            className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
          />
          <div
            className={`ml-1 ${isCompleted ? 'line-through text-muted-foreground' : ''}`}
          >
            <p
              className={`font-medium ${isCompleted ? '' : 'text-foreground'}`}
            >
              {listItem.item.name}
            </p>
            {listItem.item.category && (
              <p className="text-sm text-muted-foreground">
                {listItem.item.category}
              </p>
            )}
          </div>
        </label>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              onRemoveItem(listItem.id, listItem.item.name)
            }}
            className={`${isCompleted ? 'w-8 h-8' : 'w-9 h-9'} border-destructive/20 text-destructive/70 hover:bg-destructive/8 hover:text-destructive hover:border-destructive/30 transition-colors`}
            aria-label={`Remove ${listItem.item.name} from list`}
          >
            ×
          </Button>
        </div>
      </div>
    </div>
  )
}
