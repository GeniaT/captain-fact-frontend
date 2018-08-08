import React from 'react'
import { Query } from 'react-apollo'
import gql from 'graphql-tag'
import { Map } from 'immutable'
import UserAction from '../UsersActions/UserAction'
import PaginationMenu from '../Utils/PaginationMenu'
import { LoadingFrame } from '../Utils/LoadingFrame'


const QUERY = gql`
  query UserActivityLog($username: String!) {
    user(username: $username) {
      actions {
        id
        type
        entity
        entityId
        time
        changes
        context
        targetUser {
          username
          name
        }
      }
    }
  }
`

const ActivityLog = ({params: {username}}) => (
  <Query query={QUERY} variables={{username}} fetchPolicy="cache-and-network">
    {({loading, data: {user}}) => {
      const paginationMenu = (
        <div className="panel-heading">
          <PaginationMenu disabled={loading}/>
        </div>
      )

      return (
        <div className="activity-log container">
          {paginationMenu}
          {loading
            ? <div className="panel-block"><LoadingFrame /></div>
            : user.actions.map(a => (
              <UserAction
                key={a.id}
                action={{...a, changes: new Map(JSON.parse(a.changes))}}
                withoutUser
              />
            ))
          }
          {paginationMenu}
        </div>
      )
    }}
  </Query>
)

export default ActivityLog
