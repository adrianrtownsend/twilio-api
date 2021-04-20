const config = require('./config');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const logger = require('pino')();

require('./db/db');

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
})); // for parsing application/x-www-form-urlencoded

app.get('/', (req, res, next) => {
  res.send('Welcome Home');
});

/*
// Old Routes --------------------------------------
const apiRouter = require('./routes/api');
const gravityFormsRouter = require('./routes/gravityForms');
const mauticRouter = require('./routes/crm/mautic');
const testRouter = require('./routes/test');
const twilioRouter = require('./routes/public/index');

app.use('/api', apiRouter);
app.use('/gravityForms', gravityFormsRouter);
app.use('/mautic', mauticRouter);
app.use('/test/', testRouter);
app.use('/', twilioRouter);
*/

// New Routes --------------------------------------
const publicRouter = require('./routes/public/index');
const mauticRouter = require('./routes/private/crm/mautic');
const gFormsRouter = require('./routes/private/gravityForms');
const twilioRouter = require('./routes/private/twilio');

aap.use('/public', publicRouter);
app.use('/mautic', mauticRouter);
app.use('/gForms', gFormsRouter);
app.use('/twilio', twilioRouter);

app.listen(config.port, () => {
  logger.info(`Application started on port ${config.port}`);
});