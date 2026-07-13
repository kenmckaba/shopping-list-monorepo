import type { ListItemType } from '@/components/shopping-list-type'
import { Button } from '@/components/ui/button'
import { useEffect, useRef, useState } from 'react'

interface ListItemProps {
  listItem: ListItemType
  isCompleted: boolean
  idPrefix?: string
  onToggleComplete: (itemId: string, currentStatus: boolean) => void
  onRemoveItem: (itemId: string, itemName: string) => void
}

export function ListItem({
  listItem,
  isCompleted,
  idPrefix = 'item',
  onToggleComplete,
  onRemoveItem,
}: ListItemProps) {
  const [optimisticChecked, setOptimisticChecked] = useState(false)
  const toggleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (toggleTimeoutRef.current) {
        clearTimeout(toggleTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (listItem.isCompleted) {
      setOptimisticChecked(false)
    }
  }, [listItem.isCompleted])

  const effectiveChecked = listItem.isCompleted || optimisticChecked

  const handleToggle = () => {
    if (listItem.isCompleted) {
      onToggleComplete(listItem.id, listItem.isCompleted)
      return
    }

    setOptimisticChecked(true)

    if (toggleTimeoutRef.current) {
      clearTimeout(toggleTimeoutRef.current)
    }

    toggleTimeoutRef.current = setTimeout(() => {
      onToggleComplete(listItem.id, listItem.isCompleted)
      toggleTimeoutRef.current = null
    }, 500)
  }

  return (
    <div
      id="list-item"
      className={`w-full p-2 shadow-sm transition-all duration-200 rounded-lg hover:bg-muted/60 bg-muted ${
        isCompleted ? 'opacity-70' : 'opacity-100'
      }`}
    >
      <div id="inner" className="flex items-center justify-between">
        <label
          htmlFor={`${idPrefix}-${listItem.id}`}
          className="flex items-center space-x-2 flex-1 cursor-pointer"
        >
          <input
            type="checkbox"
            id={`${idPrefix}-${listItem.id}`}
            name="itemCompleted"
            checked={effectiveChecked}
            onChange={handleToggle}
            className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
          />
          <div className="ml-1">
            <p
              className={`font-medium ${effectiveChecked ? 'line-through text-muted-foreground' : 'text-foreground'}`}
            >
              {listItem.name}
            </p>
          </div>
        </label>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              onRemoveItem(listItem.id, listItem.name)
            }}
            className={`${isCompleted ? 'w-8 h-8' : 'w-9 h-9'} border-destructive/20 text-destructive/70 hover:bg-destructive/8 hover:text-destructive hover:border-destructive/30 transition-colors`}
            aria-label={`Remove ${listItem.name} from list`}
          >
            ×
          </Button>
        </div>
      </div>
    </div>
  )
}
