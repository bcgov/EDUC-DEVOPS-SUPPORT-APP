const express = require('express');
const router = express.Router();
const auth = require('../components/auth');
const utils = require('../components/utils');
const extendSession = utils.extendSession();
const { getSagas, getSagaEventsById, updateSaga } = require('../components/sagas');

router.get('/paginated', auth.isValidSagaAdmin, extendSession, getSagas);
router.get('/:id', auth.isValidSagaAdmin, extendSession, getSagaEventsById);
router.post('/:id', auth.isValidSagaAdmin, extendSession, updateSaga);

module.exports = router;
