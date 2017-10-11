import { combineReducers } from 'redux';
import { routerReducer as routing } from 'react-router-redux';

const initialEntitiesStates = {
  clips: [],
};


/**
* @summary Entity Reducer, handles the database
*          models and their values within the state
*/
function entities(state = initialEntitiesStates, action) {
    return state;
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
