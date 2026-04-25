import { gql } from '@apollo/client'

// Get user by email for authentication
export const GET_USER_BY_EMAIL = gql`
  query GetUserByEmail($email: String!) {
    users(where: {email: {_eq: $email}}) {
      id
      name
      email
      last_opened_list_id
      created_at
      updated_at
    }
  }
`

// Get user by ID
export const GET_USER_BY_ID = gql`
  query GetUserById($id: uuid!) {
    users_by_pk(id: $id) {
      id
      name
      email
      last_opened_list_id
      created_at
      updated_at
    }
  }
`

// Get shopping list by ID
export const GET_LIST_BY_ID = gql`
  query GetShoppingListById($id: uuid!) {
    shopping_lists_by_pk(id: $id) {
      id
      title
      owner_id
      created_at
      updated_at
    }
  }
`

// Get all items for a specific shopping list
export const GET_LIST_ITEMS = gql`
  query GetListItems($listId: uuid!) {
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

// Get user's accessible shopping lists
export const GET_USER_ACCESSIBLE_LISTS = gql`
  query GetUserAccessibleLists($userId: uuid!) {
    shopping_lists(where: {owner_id: {_eq: $userId}}, order_by: {created_at: desc}) {
      id
      title
      owner_id
      created_at
      updated_at
    }
  }
`

// Get all users (for admin purposes)
export const GET_USERS = gql`
  query GetUsers {
    users(order_by: {created_at: desc}) {
      id
      name
      email
      created_at
      updated_at
    }
  }
`
