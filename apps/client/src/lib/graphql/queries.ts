import { gql } from '@apollo/client'

export const GET_USERS = gql`
  query GetUsers {
    getUsers {
      id
      name
      email
      createdAt
    }
  }
`

export const GET_USER_BY_EMAIL = gql`
  query GetUserByEmail($email: String!) {
    getUserByEmail(email: $email) {
      id
      name
      email
      lastOpenedListId
      createdAt
    }
  }
`

export const GET_USER_BY_ID = gql`
  query GetUserById($id: ID!) {
    getUserById(id: $id) {
      id
      name
      email
      lastOpenedListId
      createdAt
    }
  }
`

export const GET_USER_LISTS = gql`
  query GetUserLists($userId: ID!) {
    getUserLists(userId: $userId) {
      id
      title
      description
      isPublic
      createdAt
      updatedAt
      owner {
        id
        name
        email
      }
    }
  }
`

export const GET_LIST_BY_ID = gql`
  query GetShoppingListById($id: ID!) {
    getShoppingListById(id: $id) {
      id
      title
      description
      isPublic
      createdAt
      updatedAt
      owner {
        id
        name
        email
      }
    }
  }
`

export const GET_LIST_ITEMS = gql`
  query GetListItems($listId: ID!) {
    getListItems(listId: $listId) {
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
      }
      list {
        id
        title
      }
    }
  }
`

export const GET_USER_ACCESSIBLE_LISTS = gql`
  query GetUserAccessibleLists($userId: ID!) {
    getUserAccessibleLists(userId: $userId) {
      id
      title
      description
      isPublic
      createdAt
      updatedAt
      owner {
        id
        name
        email
      }
    }
  }
`
