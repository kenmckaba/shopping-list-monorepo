import { gql } from '@apollo/client'

export const CREATE_USER = gql`
  mutation CreateUser($name: String!, $email: String!) {
    createUser(name: $name, email: $email) {
      id
      name
      email
      createdAt
    }
  }
`

export const UPDATE_USER = gql`
  mutation UpdateUser($id: ID!, $name: String, $email: String) {
    updateUser(id: $id, name: $name, email: $email) {
      id
      name
      email
    }
  }
`

export const DELETE_USER = gql`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id)
  }
`

export const CREATE_LIST = gql`
  mutation CreateList($title: String!, $description: String, $isPublic: Boolean, $ownerId: ID!) {
    createList(title: $title, description: $description, isPublic: $isPublic, ownerId: $ownerId) {
      id
      title
      description
      isPublic
      createdAt
      owner {
        id
        name
      }
    }
  }
`

export const CREATE_ITEM = gql`
  mutation CreateItem($name: String!, $category: String) {
    createItem(name: $name, category: $category) {
      id
      name
      category
      createdBy {
        id
        name
      }
      createdAt
    }
  }
`

export const ADD_ITEM_TO_LIST = gql`
  mutation AddItemToList($listId: ID!, $itemName: String!, $quantity: Int, $notes: String) {
    addItemToList(listId: $listId, itemName: $itemName, quantity: $quantity, notes: $notes) {
      id
      quantity
      isCompleted
      notes
      addedAt
      updatedAt
      item {
        id
        name
        category
        createdBy {
          id
          name
        }
      }
      list {
        id
        title
        owner {
          id
          name
        }
      }
    }
  }
`

export const UPDATE_LIST_ITEM = gql`
  mutation UpdateListItem($id: ID!, $quantity: Int, $isCompleted: Boolean, $notes: String) {
    updateListItem(id: $id, quantity: $quantity, isCompleted: $isCompleted, notes: $notes) {
      id
      quantity
      isCompleted
      notes
      addedAt
      updatedAt
      item {
        id
        name
        category
        createdBy {
          id
          name
        }
      }
    }
  }
`

export const REMOVE_ITEM_FROM_LIST = gql`
  mutation RemoveItemFromList($id: ID!) {
    removeItemFromList(id: $id)
  }
`

export const LOGIN_USER = gql`
  mutation LoginUser($email: String!) {
    loginUser(email: $email) {
      id
      name
      email
      createdAt
    }
  }
`

export const UPDATE_LAST_OPENED_LIST = gql`
  mutation UpdateLastOpenedList($userId: ID!, $listId: ID!) {
    updateLastOpenedList(userId: $userId, listId: $listId) {
      id
      lastOpenedListId
    }
  }
`
