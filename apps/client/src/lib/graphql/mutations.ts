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
      lastOpenedListId
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
      updatedAt
    }
  }
`

export const UPDATE_LIST = gql`
  mutation UpdateList($id: ID!, $title: String, $description: String, $isPublic: Boolean) {
    updateList(id: $id, title: $title, description: $description, isPublic: $isPublic) {
      id
      title
      description
      isPublic
      updatedAt
    }
  }
`

export const DELETE_LIST = gql`
  mutation DeleteList($id: ID!) {
    deleteList(id: $id)
  }
`

export const CREATE_ITEM = gql`
  mutation CreateItem($name: String!, $category: String) {
    createItem(name: $name, category: $category) {
      id
      name
      category
      createdAt
    }
  }
`

export const UPDATE_ITEM = gql`
  mutation UpdateItem($id: UUID!, $set: itemsUpdateInput!) {
    updateitemsCollection(set: $set, filter: {id: {eq: $id}}, atMost: 1) {
      records {
        id
        name
        category
        updated_at
      }
    }
  }
`

export const DELETE_ITEM = gql`
  mutation DeleteItem($id: UUID!) {
    deleteFromitemsCollection(filter: {id: {eq: $id}}, atMost: 1) {
      affectedCount
    }
  }
`

export const ADD_ITEM_TO_LIST = gql`
  mutation AddItemToList($objects: [list_itemsInsertInput!]!) {
    insertIntolist_itemsCollection(objects: $objects) {
      records {
        id
        quantity
        is_completed
        notes
        list_id
        item_id
        added_at
        updated_at
      }
    }
  }
`

export const UPDATE_LIST_ITEM = gql`
  mutation UpdateListItem($id: UUID!, $set: list_itemsUpdateInput!) {
    updatelist_itemsCollection(set: $set, filter: {id: {eq: $id}}, atMost: 1) {
      records {
        id
        quantity
        is_completed
        notes
        updated_at
      }
    }
  }
`

export const REMOVE_ITEM_FROM_LIST = gql`
  mutation RemoveItemFromList($id: UUID!) {
    deleteFromlist_itemsCollection(filter: {id: {eq: $id}}, atMost: 1) {
      affectedCount
    }
  }
`

export const CREATE_LIST_SHARE = gql`
  mutation CreateListShare($objects: [list_sharesInsertInput!]!) {
    insertIntolist_sharesCollection(objects: $objects) {
      records {
        id
        permission
        list_id
        user_id
        shared_at
      }
    }
  }
`

export const UPDATE_LIST_SHARE = gql`
  mutation UpdateListShare($id: UUID!, $set: list_sharesUpdateInput!) {
    updatelist_sharesCollection(set: $set, filter: {id: {eq: $id}}, atMost: 1) {
      records {
        id
        permission
      }
    }
  }
`

export const DELETE_LIST_SHARE = gql`
  mutation DeleteListShare($id: UUID!) {
    deleteFromlist_sharesCollection(filter: {id: {eq: $id}}, atMost: 1) {
      affectedCount
    }
  }
`
