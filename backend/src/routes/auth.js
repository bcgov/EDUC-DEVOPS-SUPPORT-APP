'use strict';

const config = require('../config/index');
const passport = require('passport');
const express = require('express');
const auth = require('../components/auth');
const jsonwebtoken = require('jsonwebtoken');
const roles = require('../components/roles');
const log = require('../components/logger');
const HttpStatus = require('http-status-codes');

const {
  validationResult
} = require('express-validator');

const isValidStaffUserWithRoles = auth.isValidUser(roles.SAGA_DASHBOARD);

const router = express.Router();

//provides a callback location for the auth service
router.get('/callback',
  passport.authenticate('oidc', {
    failureRedirect: 'error',
  }),
  (_req, res) => {
    res.redirect(config.get('server:frontend'));
  }
);

//a prettier way to handle errors
router.get('/error', (_req, res) => {
  res.status(401).json({
    message: 'Error: Unable to authenticate'
  });
});

//redirects to the SSO login screen
router.get('/login', passport.authenticate('oidc', {
  failureRedirect: 'error'
}));

function logout(req) {
  req.logout();
  req.session.destroy();
}

//removes tokens and destroys session
router.get('/logout', async (req, res) => {
  if (req?.session) {
    logout(req);
    let retUrl;
    if (req.query && req.query.sessionExpired) {
      retUrl = encodeURIComponent(config.get('logoutEndpoint') + '?post_logout_redirect_uri=' + config.get('server:frontend') + '/session-expired');
    } else {
      retUrl = encodeURIComponent(config.get('logoutEndpoint') + '?post_logout_redirect_uri=' + config.get('server:frontend') + '/logout');
    }
    res.redirect(config.get('siteMinder_logout_endpoint') + retUrl);
  } else {
    if (req.query && req.query.sessionExpired) {
      res.redirect(config.get('server:frontend') + '/session-expired');
    } else {
      res.redirect(config.get('server:frontend') + '/logout');
    }
  }

});

//refreshes jwt on refresh if refreshToken is valid
router.post('/refresh', [], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(HttpStatus.BAD_REQUEST).json({
      errors: errors.array()
    });
  }
  if (!req['user'] || !req['user'].refreshToken) {
    res.status(HttpStatus.UNAUTHORIZED).json();
  } else {
    if (auth.isTokenExpired(req.user.jwt)) {
      const newTokens = await auth.renew(req['user'].refreshToken);
      if (newTokens && newTokens.jwt && newTokens.refreshToken) {
        req['user'].jwt = newTokens.jwt;
        req['user'].refreshToken = newTokens.refreshToken;
        const isAuthorizedUser = isValidStaffUserWithRoles(req);
        const isValidSagaUser = auth.isValidUser(roles.SAGA_DASHBOARD);
        const responseJson = {
          isAuthorizedUser: isAuthorizedUser,
          isValidSagaUser: isValidSagaUser
        };

        return res.status(HttpStatus.OK).json(responseJson);
      } else {
        res.status(HttpStatus.UNAUTHORIZED).json();
      }
    } else {
      const isAuthorizedUser = isValidStaffUserWithRoles(req);
      const isValidSagaUser = auth.isValidUser(roles.SAGA_DASHBOARD);
      const responseJson = {
        isAuthorizedUser: isAuthorizedUser,
        isValidSagaUser: isValidSagaUser
      };
      return res.status(HttpStatus.OK).json(responseJson);
    }
  }

});

router.get('/user', (req, res) => {
  const thisSession = req['session'];
  let userToken;
  try {
    if(thisSession['passport']?.user?.jwt) {
      userToken = jsonwebtoken.verify(thisSession['passport']?.user?.jwt, config.get('oidc:publicKey'));
      if (userToken === undefined || userToken.realm_access === undefined || userToken.realm_access.roles === undefined) {
        return res.status(HttpStatus.UNAUTHORIZED).json();
      }
    } else {
      return res.status(HttpStatus.UNAUTHORIZED).json();
    }
  }catch (e){
    log.error('error is from verify', e);
    return res.status(HttpStatus.UNAUTHORIZED).json();
  }
  const userName = {
    userName: userToken['idir_username'],
    userGuid: userToken.idir_guid.toUpperCase(),
    userRoles: userToken.realm_access.roles,
    displayName: userToken['display_name']
  };

  if (userName.userName && userName.userGuid) {
    return res.status(HttpStatus.OK).json(userName);
  } else {
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json();
  }

});

router.get('/user-session-remaining-time', (req, res) => {
  if (req?.session?.cookie && req?.session?.passport?.user) {
    const remainingTime = req.session.cookie.maxAge;
    log.info(`session remaining time is :: ${remainingTime} for user`, req.session?.passport?.user?.displayName);
    return res.status(HttpStatus.OK).json(req.session.cookie.maxAge);
  } else {
    return res.sendStatus(HttpStatus.UNAUTHORIZED);
  }
});

module.exports = router;
