const config = require('../../config/index');

const SAGA_TYPES = Object.freeze({
  PEN_REQUEST_BATCH: {
    id: 'penRequestBatch',
    eventUrl: `${config.get('server:penRequestBatchApi:rootUrl')}/%s/saga-events`, //need to replace %s to use
    paginatedUrl: `${config.get('server:penRequestBatchApi:paginatedUrl')}`,
    rootUrl: `${config.get('server:penRequestBatchApi:rootUrl')}`
  },
  STUDENT_PROFILE: {
    id: 'studentProfile',
    eventUrl: `${config.get('server:studentProfileSagaApi:rootUrl')}/%s/events`, //need to replace %s to use
    paginatedUrl: `${config.get('server:studentProfileSagaApi:paginatedUrl')}`,
    rootUrl: `${config.get('server:studentProfileSagaApi:rootUrl')}`
  },
  REPLICATION: {
    id: 'replication',
    eventUrl: `${config.get('server:replicationApi:rootUrl')}/%s/events`, //need to replace %s to use
    paginatedUrl: `${config.get('server:replicationApi:paginatedUrl')}`,
    rootUrl: `${config.get('server:replicationApi:rootUrl')}`
  }
});
module.exports = {
  SAGA_TYPES
};
