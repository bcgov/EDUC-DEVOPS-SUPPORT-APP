'use strict';


class HealthCheckController {
  constructor(express) {
    this._router = express.Router();
    this._router.get('/api/health', (req, res) => this.healthCheck(req, res));
  }

  get router() {
    return this._router;
  }

  async healthCheck(req, res) {
    res.sendStatus(200);
  }
}

const EXPRESS = require('express');
module.exports = new HealthCheckController(EXPRESS);
