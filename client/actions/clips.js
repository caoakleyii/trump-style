import * as ActionTypes from './actionTypes';
import request from './request';

export const getAllClips = function() {

  return request({
    path: '/clips',
    method: 'GET',
    actionType: ActionTypes.CLIPS_REQUEST,
    entityName: 'clips'
  });
};
