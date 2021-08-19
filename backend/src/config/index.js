'use strict';
const nconf = require('nconf');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config();

const env = 'local';//process.env.NODE_ENV;

nconf.argv()
  .file({file: path.join(__dirname, `${env}.json`)});

nconf.defaults({
  environment: env,
  logoutEndpoint: process.env.KC_DOMAIN + '/protocol/openid-connect/logout',
  siteMinder_logout_endpoint: process.env.SITEMINDER_LOGOUT_ENDPOINT,
  server: {
    frontend: process.env.SERVER_FRONTEND,
    backend: process.env.SERVER_FRONTEND + '/api',
    logLevel: process.env.LOG_LEVEL,
    morganFormat: 'dev',
    port: '8080',
    session: {
      maxAge: +process.env.SESSION_MAX_AGE
    },
    penRequestBatchApi: {
      rootUrl: process.env.PEN_REQ_BATCH_API_URL,
      paginatedUrl: process.env.PEN_REQ_BATCH_API_URL + '/paginated'
    },
    studentProfileSagaApi: {
      rootUrl: process.env.STUDENT_PROFILE_API_URL,
      paginatedUrl: process.env.STUDENT_PROFILE_API_URL + '/paginated'
    },
    replicationApi: {
      rootUrl: process.env.REPLICATION_API_URL,
      paginatedUrl: process.env.REPLICATION_API_URL + '/paginated'
    },
    roles: {
      sagaDashboard: process.env.SAGA_ADMIN_ROLE
    }
  },
  oidc: {
    publicKey: process.env.SOAM_PUBLIC_KEY,
    clientId: process.env.ID,
    clientSecret: process.env.SECRET,
    discovery: process.env.DISCOVERY,
  }
});
module.exports = nconf;
