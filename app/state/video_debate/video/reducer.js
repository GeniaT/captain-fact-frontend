import { handleActions, createAction } from 'redux-actions'
import { Record, List } from 'immutable'

import Video from '../../videos/record'
import Speaker from './speaker_record'


export const fetchAll = createAction('VIDEO/FETCH_ALL')
export const setLoading = createAction('VIDEO/SET_LOADING')
export const addSpeaker = createAction('VIDEO/ADD_SPEAKER')
export const removeSpeaker = createAction('VIDEO/REMOVE_SPEAKER')
export const updateSpeaker = createAction('VIDEO/UPDATE_SPEAKER')
export const reset = createAction('VIDEO/RESET')

export const setPosition = createAction('PLAYBACK/SET_POSITION')
export const forcePosition = createAction('PLAYBACK/FORCE_POSITION')
export const resetPosition = createAction('PLAYBACK/RESET_POSITION')
export const resetForcedPosition = createAction('PLAYBACK/RESET_FORCED_POSITION')

const INITIAL_STATE = new Record({
  data: new Video(),
  errors: null,
  isLoading: false,
  playback: new Record({
    position: null,
    forcedPosition: null
  })()
})
const VideoReducer = handleActions({
  [fetchAll]: {
    next: (state, {payload: {speakers, ...data}}) => {
      speakers = sortSpeakers(new List(speakers.map(s => new Speaker(s))))
      return state.mergeDeep({
        isLoading: false,
        errors: null,
        data: new Video(data).set('speakers', speakers)
      })
    },
    throw: (state, {payload}) => state.merge({errors: payload, isLoading: false})
  },
  [setLoading]: (state, {payload}) =>
    state.set('isLoading', payload),
  [addSpeaker]: (state, {payload}) =>
    state.updateIn(['data', 'speakers'], s => sortSpeakers(s.push(new Speaker(payload)))),
  [removeSpeaker]: (state, {payload: {id}}) => {
    const speakerIdx = state.data.speakers.findIndex(s => s.id === id)
    if (speakerIdx !== -1)
      return state.deleteIn(['data', 'speakers', speakerIdx])
    return state
  },
  [updateSpeaker]: (state, {payload}) => {
    const speakerIdx = state.data.speakers.findIndex(s => s.id === payload.id)
    if (speakerIdx !== -1)
      return state
        .mergeIn(['data', 'speakers', speakerIdx], payload)
        .updateIn(['data', 'speakers'], speakers => sortSpeakers(speakers))
    return state
  },
  [reset]: state => INITIAL_STATE(),
  [setPosition]: (state, {payload}) =>
    state.setIn(['playback', 'position'], Math.trunc(payload)),
  [forcePosition]: (state, {payload}) =>
    state.update('playback', p => p.merge({position: payload, forcedPosition: payload + 1})),
  [resetForcedPosition]: (state, {payload}) =>
    state.setIn(['playback', 'forcedPosition'], null),
  [resetPosition]: state => state.update('playback', p => p.merge({position: null, forcedPosition: null}))
}, INITIAL_STATE())
export default VideoReducer

function sortSpeakers(speakers) {
  return speakers.sortBy(s => s.title + s.full_name)
}