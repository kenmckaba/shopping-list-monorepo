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

export const GET_USER_BY_ID = gql`
  query GetUserById($id: ID!) {
    getUserById(id: $id) {
      id
      name
      email
      createdAt
      ownedLists {
        id
        title
        description
        isPublic
        createdAt
      }
      sharedLists {
        id
        permission
        sharedAt
        list {
          id
          title
          description
          isPublic
        }
      }
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
      owner {
        id
        name
      }
      items {
        id
        quantity
        isCompleted
        notes
        addedAt
        item {
          id
          name
          category
        }
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

export const SEARCH_ITEMS = gql`
  query SearchItems($query: String!) {
    searchItems(query: $query) {
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
