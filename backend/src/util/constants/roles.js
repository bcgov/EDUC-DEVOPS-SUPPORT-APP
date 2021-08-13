'use strict';

const config = require('../../config');

const roles = {
    //Help functions created in auth module: isValidSAGAAdmin
    SAGA_DASHBOARD: config.get('server:roles:sagaDashboard')
};

module.exports = roles;
