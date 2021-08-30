'use strict';

const HttpStatus = require('http-status-codes');
const axios = require('axios');
const config = require('../config/index');
const lodash = require('lodash');
const log = require('./logger');
const fsStringify = require('fast-safe-stringify');
const {ApiError} = require('./error');

let discovery = null;

function getBackendToken(req) {
  const thisSession = req.session;
  return thisSession && thisSession['passport'] && thisSession['passport'].user && thisSession['passport'].user.jwt;
}

function unauthorizedError(res) {
  return res.status(HttpStatus.UNAUTHORIZED).json({
    message: 'No access token'
  });
}

function errorResponse(res, msg, code) {
  return res.status(code || HttpStatus.INTERNAL_SERVER_ERROR).json({
    message: msg || 'INTERNAL SERVER ERROR',
    code: code || HttpStatus.INTERNAL_SERVER_ERROR
  });
}

function addTokenToHeader(params, token) {
  if (params) {
    params.headers = {
      Authorization: `Bearer ${token}`,
    };
  } else {
    params = {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    };
  }
  return params;
}

async function getData(token, url, params) {
  try {
    params = addTokenToHeader(params, token);
    logRequestData('GET', url);
    const response = await axios.get(url, params);
    logResponseData(url, response, 'GET');
    return response.data;
  } catch (e) {
    throwError(e, url, 'GET');
  }
}

async function logApiError(e, functionName, message) {
  if (e?.response?.status === 404) {
    log.info('Entity not found', e);
  } else if (e?.response?.data) {
    log.error(fsStringify(e.response.data));
  } else if (message) {
    log.error(message);
  } else {
    log.error(functionName, ' Error', e);
  }
}

function minify(obj, keys = ['documentData']) {
  return lodash.transform(obj, (result, value, key) =>
    result[key] = keys.includes(key) && lodash.isString(value) ? value.substring(0, 1) + ' ...' : value);
}

async function logResponseData(url, response, operationType) {
  log.info(`${operationType} Data Status for url ${url} :: is :: `, response.status);
  log.info(`${operationType} Data StatusText for url ${url}  :: is :: `, response.statusText);
  log.verbose(`${operationType} Data Response for url ${url}  :: is :: `, typeof response.data === 'string' ? response.data : minify(response.data));
}

/**
 *
 * @param operationType the type of Operation {POST, PUT, GET, DELETE}
 * @param url the url being hit
 * @param data the data passed onto the http request.
 * @returns {Promise<void>}
 */
async function logRequestData(operationType, url, data) {
  log.info(`${operationType} Data Url`, url);
  if (data) {
    log.verbose(`${operationType} Data Req`, typeof data === 'string' ? data : minify(data));
  }
}

async function postData(token, url, data, params, user) {
  try {
    params = addTokenToHeader(params, token);
    if (user && typeof user === 'string') {
      data.createUser = user;
      data.updateUser = user;
    }
    logRequestData('POST', url, data);
    const response = await axios.post(url, data, params);
    logResponseData(url, response, 'POST');
    return response.data;
  } catch (e) {
    throwError(e, url, 'POST');
  }
}

function throwError(e, url, operationType) {
  logApiError(e, operationType, `Error during ${operationType} on ${url}`);
  const status = e.response ? e.response.status : HttpStatus.INTERNAL_SERVER_ERROR;
  throw new ApiError(status, {message: `API  ${operationType} error, on ${url}`}, e);
}

async function putData(token, url, data, user) {
  try {
    const putDataConfig = {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    };
    if(user && typeof user === 'string'){
      data.updateUser = user;
    }
    logRequestData('PUT', url, data);
    const response = await axios.put(url, data, putDataConfig);
    logResponseData(url, response, 'PUT');
    return response.data;
  } catch (e) {
    throwError(e, url, 'PUT');
  }
}

const utils = {
  // Returns OIDC Discovery values
  async getOidcDiscovery() {
    if (!discovery) {
      try {
        const response = await axios.get(config.get('oidc:discovery'));
        discovery = response.data;
      } catch (error) {
        log.error('getOidcDiscovery', `OIDC Discovery failed - ${error.message}`);
      }
    }
    return discovery;
  },
  extendSession() {
    return function (req, res, next) {
      if (req && req.session) {
        log.debug('req.session.cookie.maxAge before is ::', req.session.cookie.maxAge);
        req['session'].touch();
        // NOSONAR
        req['session'].tempSessionExtensionIdentifier = Math.random(); // DO NOT USE this key anywhere else in session.
        log.debug('req.session.cookie.maxAge after is ::', req.session.cookie.maxAge);
        return next();
      } else {
        return next(); // let the next handler deal with what to do when no session
      }
    };
  },
  getBackendToken,
  getData,
  logApiError,
  postData,
  putData,
  errorResponse,
  unauthorizedError
};

module.exports = utils;
