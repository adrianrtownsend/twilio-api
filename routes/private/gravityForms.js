/**
 * Used for making entries to specified form in Gravity forms application through Rest API 
*/

const config = require('../../config');

// Middleware
const router = require('express').Router();
const {
  genToken,
  validateToken
} = require('../../middleware/tokenValidation');
const {
  pushToGForms
} = require('../../middleware/gravityForms-helpers/index');

// Push new entry to specified gravity form
router.post('/pushToGForms', (req, res) => {

  /**
   * @param {string} kid - Id to ref which api key
   * @param {string} secret - Secret to ref which api key
   * @param {object} gFormData - key/value combination of fields & corresponding entry data for each field
   * @param {string} gFormId - Id of target gravity form
   * 
   * Steps:
   * 1) gen token
   * 2) validate token
   * 3) pushToGForms
  */

  genToken(req.body)
  .then(a => {
    validateToken(a)
    .then(() => {
      pushToGForms(req.body)
      .then(c => res.status(c.code).json(c.body))
      // error pushing entry to gravity forms
      .catch(err => res.status(500).json(err));
    })
    // token validation error
    .catch(err => res.status(500).json(err));
  })
  // token generation error
  .catch(err => res.status(500).json(err));

});

module.exports = router;