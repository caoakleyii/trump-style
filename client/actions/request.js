import * as ActionTypes from './actionTypes';
import { Promise } from 'es6-promise'
import fetch from 'isomorphic-fetch';

const default_options = {
  scheme: api_scheme,
  host: api_domain,
  port: api_port,
  prefix: '/api',
  path: '',
  queryStrings: '',
  headers: {},
  body: undefined,
  method: 'GET',
  actionType: undefined,
  entityName: ''
};

function requested(options) {
  return {
    type: options.actionType
  };
}

function requestFailed(status, msg, actionType) {
  return {
    type: actionType,
    errorMessage: msg,
    status: status,
    receivedAt: new Date()
  };
}

function requestSuccess(data, options) {
  return {
    type: options.actionType,
    data: data,
    entityName: options.entityName,
    receivedAt: new Date(),
    success: true
  };
}


const request = function(passedOptions = {}) {
  let options = {};
  Object.assign(options, default_options, passedOptions);

  return function(dispatch){
    requested(options)

    return fetch(`${options.scheme}://${options.host}:${options.port}${options.prefix}${options.path}?${options.queryStrings}`,
      {
        headers: options.headers,
        body: options.body,
        method: options.method
      })
      .then(resp => {
        switch(resp.status){
          case 200:
            return Promise.resolve(resp.json());
          case 401:
            // handle unauthorized;
            return Promise.reject(resp.status, 'Unauthorized', options);
          case 404:
            // handle not found;
            return Promise.reject(resp.status, 'Not Found', options);
          default:
            return Promise.reject(resp.status, 'Not OK response', options)
        }
      })
      .then(data => {
        dispatch(requestSuccess(data, options));
        return data;
      })
      .catch(err => {
        /* if (status && msg && options) {
          dispatch(requestFailed(status, msg, options.actionType));
          console.log(`${msg} - ${status} \n\n${options}`);
          return msg;
        } */
        console.log(err);
        return;
      })
  }

}

export default request;
