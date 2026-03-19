import { gql } from '@apollo/client'

export const USER_ADDED = gql`
  subscription UserAdded {
    userAdded {
      id
      name
      email
      createdAt
    }
  }
`

export const USER_UPDATED = gql`
  subscription UserUpdated {
    userUpdated {
      id
      name
      email
    }
  }
`

export const USER_DELETED = gql`
  subscription UserDeleted {
    userDeleted
  }
`

export const LIST_ADDED = gql`
  subscription ListAdded {
    listAdded {
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

export const LIST_UPDATED = gql`
  subscription ListUpdated {
    listUpdated {
      id
      title
      description
      isPublic
      owner {
        id
        name
      }
    }
  }
`

export const LIST_DELETED = gql`
  subscription ListDeleted {
    listDeleted
  }
`

export const ITEM_ADDED_TO_LIST = gql`
  subscription ItemAddedToList {
    itemAddedToList {
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

export const ITEM_UPDATED = gql`
  subscription ItemUpdated {
    itemUpdated {
      id
      quantity
      isCompleted
      notes
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

export const ITEM_REMOVED = gql`
  subscription ItemRemoved {
    itemRemoved
  }
`
