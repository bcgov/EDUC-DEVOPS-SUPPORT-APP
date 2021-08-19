'use strict';

const config = require('./config/index');
const dotenv = require('dotenv');
const log = require('./components/logger');
const morgan = require('morgan');
const session = require('express-session');
const express = require('express');
const passport = require('passport');
const helmet = require('helmet');
const cors = require('cors');
const utils = require('./components/utils');

dotenv.config();
const OidcStrategy = require('passport-openidconnect-kc-idp').Strategy;
const apiRouter = express.Router();
const authRouter = require('./routes/auth');
const sagaRouter = require('./routes/sagas');
const promMid = require('express-prometheus-middleware');
//initialize app
const app = express();
const nocache = require('nocache');
app.set('trust proxy', 1);
//sets security measures (headers, etc)
// NOSONAR
app.use(cors());
app.use(helmet());
app.use(nocache());
app.use(promMid({
  metricsPath: '/api/prometheus',
  collectDefaultMetrics: true,
  requestDurationBuckets: [0.1, 0.5, 1, 1.5]
}));

//tells the app to use json as means of transporting data
app.use(express.json());
app.use(express.urlencoded({
  extended: false
}));
const logStream = {
  write: (message) => {
    log.info(message);
  }
};

const cookie = {
  secure: true,
  httpOnly: true,
  maxAge: 1800000 //30 minutes in ms. this is same as session time. DO NOT MODIFY, IF MODIFIED, MAKE SURE SAME AS SESSION TIME OUT VALUE.
};
if ('local' === config.get('environment')) {
  cookie.secure = false;
}
app.use(session({
  secret: config.get('oidc:clientSecret'),
  resave: false,
  saveUninitialized: true,
  cookie: cookie
}));
//initialize routing and session. Cookies are now only reachable via requests (not js)
app.use(passport.initialize());
app.use(passport.session());

//initialize our authentication strategy
utils.getOidcDiscovery().then(discovery => {
  //OIDC Strategy is used for authorization
  passport.use('oidc', new OidcStrategy({
    issuer: discovery.issuer,
    authorizationURL: discovery.authorization_endpoint,
    tokenURL: discovery.token_endpoint,
    userInfoURL: discovery['userinfo_endpoint'],
    clientID: config.get('oidc:clientId'),
    clientSecret: config.get('oidc:clientSecret'),
    callbackURL: config.get('server:frontend') + '/api/auth/callback',
    scope: discovery.scopes_supported,
    kc_idp_hint: 'keycloak_bcdevexchange_idir'
  }, (_issuer, _sub, profile, accessToken, refreshToken, done) => {
    if ((typeof (accessToken) === 'undefined') || (accessToken === null) ||
      (typeof (refreshToken) === 'undefined') || (refreshToken === null)) {
      return done('No access token', null);
    }
    //set access and refresh tokens
    profile.jwt = accessToken;
    profile.refreshToken = refreshToken;
    return done(null, profile);
  }));
}).catch((e) => {
  log.error(`discovery failed, ${e}`);
});
//functions to serialize/deserialize users
passport.serializeUser((user, next) => next(null, user));
passport.deserializeUser((obj, next) => next(null, obj));

app.use(morgan(config.get('server:morganFormat'), {'stream': logStream}));
//set up routing to auth and main API
app.use(/(\/api)?/, apiRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/sagas', sagaRouter);

// Prevent unhandled errors from crashing application
process.on('unhandledRejection', err => {
  log.error(err.stack);
});
// Prevent unhandled errors from crashing application
process.on('error', err => {
  log.error(err.stack);
});
module.exports = app;
