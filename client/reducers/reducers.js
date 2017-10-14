import * as ActionTypes from '../actions/actionTypes.js';
import { combineReducers } from 'redux';
import { routerReducer as routing } from 'react-router-redux';

const initialEntitiesStates = {
  clips: [],
  music: [],
  state_id: '',
  states: []
};


/**
* @summary Entity Reducer, handles the database
*          models and their values within the state
*/
function entities(state = initialEntitiesStates, action) {

    // if the result of the action isn't a success don't update the entities
    if (!action.success) {
      return state;
    }

    // if it is continue to process the action and update the store
    if (action.data instanceof Array)
    {
        // update a collection of entities
        // within the state object from an array of data returned
        let returnState = state;
        action.data.forEach(e => {
          returnState =  updateStateEntities(state[action.entityName], e, returnState);
        });
        return returnState;
    } else if (action.data instanceof Object) {
      // update a entity within the state object
      return Object.assign({}, state, {[action.entityName] : action.data })
    } else {
      return Object.assign({}, state, {[action.entityName] : action.data })
    }
}

/**
* @summary Helper method for the entity reducer to upsert an entity within the
*          state object.
*/
function updateStateEntities(entities, entity, state, key = "pseudonym") {
  let existingEntity = entities.find((e) => e[key] == entity[key]);

  if (!existingEntity) {
    entities.push(entity);
  } else {
    Object.assign(existingEntity, entity);
  }

  return Object.assign({}, state);
}


/**
* @summary Combines the module reducers into one that is exported and used by
*          the store when configured.
*/
const reducers = combineReducers({
  entities,
  routing
});

export default reducers;
