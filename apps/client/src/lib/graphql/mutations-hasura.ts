import { gql } from '@apollo/client'

// Create a new user
export const CREATE_USER = gql`
  mutation CreateUser($name: String!, $email: String!) {
    insert_users_one(object: {name: $name, email: $email}) {
      id
      name
      email
      created_at
      updated_at
    }
  }
`

// Create a new shopping list
export const CREATE_LIST = gql`
  mutation CreateList($title: String!, $ownerId: uuid!) {
    insert_shopping_lists_one(object: {title: $title, owner_id: $ownerId}) {
      id
      title
      owner_id
      created_at
      updated_at
    }
  }
`

// Add item to shopping list
export const ADD_ITEM_TO_LIST = gql`
  mutation AddItemToList($name: String!, $quantity: Int!, $shoppingListId: uuid!) {
    insert_list_items_one(object: {
      name: $name,
      quantity: $quantity,
      shopping_list_id: $shoppingListId,
      is_completed: false
    }) {
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

// Update list item (toggle completion, change quantity, etc.)
export const UPDATE_LIST_ITEM = gql`
  mutation UpdateListItem($id: uuid!, $changes: list_items_set_input!) {
    update_list_items_by_pk(pk_columns: {id: $id}, _set: $changes) {
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

// Delete list item
export const DELETE_LIST_ITEM = gql`
  mutation DeleteListItem($id: uuid!) {
    delete_list_items_by_pk(id: $id) {
      id
    }
  }
`

// Update user's last opened list
export const UPDATE_LAST_OPENED_LIST = gql`
  mutation UpdateLastOpenedList($userId: uuid!, $listId: uuid!) {
    update_users_by_pk(pk_columns: {id: $userId}, _set: {last_opened_list_id: $listId}) {
      id
      last_opened_list_id
    }
  }
`

// Delete shopping list
export const DELETE_LIST = gql`
  mutation DeleteList($id: uuid!) {
    delete_shopping_lists_by_pk(id: $id) {
      id
    }
  }
`

// Update shopping list
export const UPDATE_LIST = gql`
  mutation UpdateList($id: uuid!, $changes: shopping_lists_set_input!) {
    update_shopping_lists_by_pk(pk_columns: {id: $id}, _set: $changes) {
      id
      title
      owner_id
      created_at
      updated_at
    }
  }
`
