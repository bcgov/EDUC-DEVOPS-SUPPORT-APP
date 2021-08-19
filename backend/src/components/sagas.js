'use strict';

const {find} = require('lodash');

const {
  logApiError, getBackendToken, getData, putData
} = require('./utils');
const HttpStatus = require('http-status-codes');
const { FILTER_OPERATION, VALUE_TYPE, CONDITION } = require('../util/constants');
const { SAGA_TYPES } = require('../util/constants/sagaTypes');

async function getSagas(req, res) {
  try {
  let searchListCriteria = [];

  if(req.query.searchCriteriaList) {
    let searchQueries = JSON.parse(req.query.searchCriteriaList);

    Object.keys(searchQueries).forEach(element => {
      if(!searchQueries[element] || (Array.isArray(searchQueries[element]) && Object.keys(searchQueries[element]).length === 0)) return; //do not add to search if null value
      let operation = FILTER_OPERATION.IN;
      let valueType = VALUE_TYPE.STRING;

      switch (element) {
        case 'createDate':
        case 'updateDate':
          if(!searchQueries[element].from) return;
          if (!searchQueries[element].end) {
            searchQueries[element].end = searchQueries[element].from;
          }
          searchQueries[element].end = searchQueries[element].end.replace(/\//g, '-');
          searchQueries[element].from = searchQueries[element].from.replace(/\//g, '-');
          searchQueries[element] = searchQueries[element].from + 'T00:00:00,' + searchQueries[element].end + 'T23:59:59';

          operation = FILTER_OPERATION.BETWEEN;
          valueType = VALUE_TYPE.DATE_TIME;
          break;
        case 'retryCount':
          operation = FILTER_OPERATION.GREATER_THAN;
          valueType = VALUE_TYPE.INTEGER;
          searchQueries[element] = 0;
          break;
        case 'sagaId':
          operation = FILTER_OPERATION.EQUAL;
          valueType = VALUE_TYPE.UUID;
          break;
        case 'status':
        case 'sagaName':
        case 'sagaState':
        default:
          if(Object.keys(searchQueries[element]).length === 0) return;
          searchQueries[element] = searchQueries[element].join(',');
          break;
      }
      searchListCriteria.push({key: element, condition: CONDITION.AND, operation: operation, value: searchQueries[element], valueType: valueType});
    });
  }
  const search = [
    {
      searchCriteriaList: searchListCriteria
    }
  ];
    const params = {
      params: {
        pageNumber: req?.query?.pageNumber,
        pageSize: req?.query?.pageSize || 10,
        sort: req?.query?.sort,
        searchCriteriaList: JSON.stringify(search)
      }
    };
    if(req?.query?.sagaType) {
      let url = find(SAGA_TYPES, {id:req.query.sagaType}).paginatedUrl;
      const dataResponse = await getData(getBackendToken(req), url, params);
      return res.status(200).json(dataResponse);
    } else {
      log.error('Missing sagaTypes in query string');
      return res.status(400).json();
    }
  } catch (e) {
    logApiError(e, 'getSagas', 'Error occurred while attempting to get sagas :: ' + e);
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      message: 'INTERNAL SERVER ERROR'
    });
  }
}

async function getSagaEventsById(req, res) {
  try {
    if(req?.query?.sagaType) {
      let eventUrl = find(SAGA_TYPES, {id: req.query.sagaType}).eventUrl.replace('%s', req.params.id);
      let sagaUrl = `${find(SAGA_TYPES, {id: req.query.sagaType}).rootUrl}/${req.params.id}`;
      Promise.all([
        getData(getBackendToken(req), eventUrl),
        getData(getBackendToken(req), sagaUrl)
      ]).then(([eventData, sagaData]) => {
        if (eventData && Array.isArray(eventData)) {
          eventData.push(sagaData);
          let responseData = {
            eventData: eventData,
            sagaData: sagaData
          };
          return res.status(200).json(responseData);
        } else {
          return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json();
        }
      });
    } else {
      log.error('Missing sagaTypes in query string');
      return res.status(400).json();
    }
  } catch(e) {
    logApiError(e, 'getSagaEventsById', 'Error occurred while attempting to get saga events :: ' + e);
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      message: 'INTERNAL SERVER ERROR'
    });
  }
}

async function updateSaga(req, res) {
  try {
    if(req?.query?.sagaType){
      let url = `${find(SAGA_TYPES, {id: req.query.sagaType}).rootUrl}/${req.params.id}`;
      const dataResponse = await putData(getBackendToken(req), url, req.body?.sagaObject);
      return res.status(200).json(dataResponse);
    } else {
      log.error('Missing sagaTypes in query string');
      return res.status(400).json();
    }
  } catch(e) {
    logApiError(e, 'updateSaga', 'Error occurred while attempting to update saga :: ' + e);
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      message: 'INTERNAL SERVER ERROR'
    });
  }
}

module.exports = {
  getSagas: getSagas,
  getSagaEventsById: getSagaEventsById,
  updateSaga: updateSaga
};
