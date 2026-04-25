import { gql } from '@apollo/client'

// Subscribe to list item changes (additions, updates, deletions)
export const LIST_ITEMS_SUBSCRIPTION = gql`
  subscription ListItemsSubscription($listId: uuid!) {
    list_items(where: {shopping_list_id: {_eq: $listId}}, order_by: {updated_at: desc}) {
      id
      name
      quantity
      is_completed
      shopping_list_id
      created_at
      updated_at
    }
  }
`

// Subscribe to shopping list changes for a user
export const USER_LISTS_SUBSCRIPTION = gql`
  subscription UserListsSubscription($userId: uuid!) {
    shopping_lists(where: {owner_id: {_eq: $userId}}, order_by: {created_at: desc}) {
      id
      title
      owner_id
      created_at
      updated_at
    }
  }
`

// Subscribe to a specific list item
export const LIST_ITEM_SUBSCRIPTION = gql`
  subscription ListItemSubscription($id: uuid!) {
    list_items_by_pk(id: $id) {
      id
      name
      quantity
      is_completed
      shopping_list_id
      created_at
      updated_at
    }
  }
`

// Subscribe to a specific shopping list
export const SHOPPING_LIST_SUBSCRIPTION = gql`
  subscription ShoppingListSubscription($id: uuid!) {
    shopping_lists_by_pk(id: $id) {
      id
      title
      owner_id
      created_at
      updated_at
    }
  }
`
