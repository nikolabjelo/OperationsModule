import {
  GraphQLList
} from 'graphql'

import {
  AuthentificationError,
  OperationsError
} from '../../errors'

import { CloneType } from '../types'
import { Clone } from '../../models'
import logger from '../../config/logger'
import getKuberneteClonePodStatus from '../../kubernetes/getClonePodStatus'
import getKuberneteClonePodLogs from '../../kubernetes/getClonePodLogs'
import cloneDetails from '../cloneDetails'
import teamQuery from '../../graphQLCalls/teamQuery'

const args = {}

const resolve = async(parent, args, context) => {
  logger.debug('Retrieving History Clones.')
  try{
   if (!context.userId) {
     throw new AuthentificationError()
   }

   let clones = await Clone.find({
     authId: context.userId,
     active: false
   }).sort({createDatetime: -1})

   for (var i = 0; i < clones.length; i++) {
      let team = await teamQuery(context.authorization, clones[i].teamId)
      clones[i] = await cloneDetails(context.userId, team.data.data.teams_TeamById, clones[i])
      clones[i].botType = clones[i].kind // Only for listing we show the teams value
   }

   return clones
 } catch (err){
   logger.error('Retrieving History Clones error: %s', err.stack)
   throw new OperationsError('There has been an error retrieving history clones.')
 }
}

const query = {
  historyClones: {
    type: new GraphQLList(CloneType),
    args,
    resolve
  }
}

export default query
