import * as ActionTypes from './actionTypes';
import request from './request';

export const postState = function(state) {
  return request({
    path: '/states',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(state),
    actionType: ActionTypes.STATE_POST,
    entityName: 'state_id'
  });
}

export const getStateById = function(id) {
  return request({
    path: `/states/${id}`,
    method: 'GET',
    actionType: ActionTypes.STATE_REQUEST,
    entityName: 'states'
  });
}
