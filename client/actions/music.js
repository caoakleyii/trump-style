import * as ActionTypes from './actionTypes';
import request from './request';

export const getAllMusic = function() {

  return request({
    path: '/music',
    method: 'GET',
    actionType: ActionTypes.MUSIC_REQUEST,
    entityName: 'music'
  });
};
