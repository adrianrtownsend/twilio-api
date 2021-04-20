// Twilio Routes

const config = require('../../config');

// Models
const User = require('../../models/user.model');
const Conversation = require('../../models/conversation.model');

// Middleware
const router = require('express').Router();
const {
  genToken,
  validateToken
} = require('../../middleware/tokenValidation');
const {
  addAdminParticipants,
  getParticipants,
  newConversation,
  updateConversationName,
  checkExistingSmsConversation,
  deleteConversation,
  validatePhone,
  triggerStudioFlow,
  triggerStudioWebhook
} = require('../../middleware/twilio-helpers/index');

// Routes
/**
 * Trigger webhook - no conversation
 * Welcome webhook - new conversation 
*/

// Trigger webhook - no conversation
router.post('/triggerWebhook', (req, res) => {

  /**
   * @param {string} kid - Id to ref which api key
   * @param {string} secret - Secret to ref which api key
   * @param {string} flowSid - Which twilio flow to use
   * @param {string} number - Which number to send flow to
   * @param {string} twilioNumber - used to evaluate which number used in switch/case
   * @param {object} params - hold all params used in twilio flow > {{flow.data}}
   * 
   * !!! This accepts params -> so runs req.is() to check if 'application/json' request, otherwise has to filter strings to push as parameters correctly
   * 
   * Steps:
   * 1) gen token
   * 2) validate token
   * 3) validate mobile number
   * 4) [if valid mobile number]
   *  [true] push to webhook with number and whatever params
   * [false] end with 403 response
  */

  genToken(req.body)
  .then(a => {
    validateToken(a)
    .then(() => {
      validatePhone(req.body)
      .then(b => {
        if(b.code !== 200) {
          res.status(b.code).json(b.body);
        } else {
          triggerStudioWebhook(req.body, req.is('application/json'))
          .then(c => res.status(c.code).json(c.body))
          // trigger Studio flow error
          .catch(err => res.status(500).json(err));
        }
      })
      // phone validation error
      .catch(err => res.status(500).json(err));
    })
    // token validation error
    .catch(err => res.status(500).json(err));
  })
  // token generation error
  .catch(err => res.status(500).json(err));

});

// Welcome webhook - new conversation
router.post('/welcomeWebhook', (req, res) => {

  /**
   * @param {string} kid - Id to ref which api key
   * @param {string} secret - Secret to ref which api key
   * @param {string} flowSid - Which twilio flow to use
   * @param {string} number - Which number to send flow to
   * @param {string} twilioNumber - used to evaluate which number used in switch/case
   * @param {object} params - hold all params used in twilio flow > {{flow.data}}
   * 
   * Steps:
   * 1) gen token
   * 2) validate token
   * 3) set conversation name
   * 4) add conversation admins
   * 5) trigger webhook
  */

  genToken(req.body)
  .then(a => {
    validateToken(a.body)
    .then(() => {
      updateConversationName(req.body)
      .then(b => {
        addAdminParticipants(b.body)
        .then(() => {
          triggerStudioFlow(req.body)
          .then(c => res.status(c.code).json(c.body))
          // trigger studio flow error
          .catch(err => res.status(500).json(err));
        })
        .catch(err => res.status(500).json(err));
      })
      // conversation update error
      .catch(err => res.status(500).json(err));
    })
    // token validation error
    .catch(err => res.status(500).json(err));
  })
  // token generation error
  .catch(err => res.status(500).json(err));

});

// Campaign push to conversation
router.post('/campaignConversationCreate', (req, res) => {

  /**
   * @param {string} kid - Id to ref which api key
   * @param {string} secret - Secret to ref which api key
   * @param {string} friendlyName - name that should be set for new conversation
   * @param {string} number - sms number assigned to the new conversation
   * @param {string} campaign - name of the campaign which the studio flow was created from
   * @param {string} firstname - first name of sms campaign contact
   * @param {string} lastname - last name of sms campaign contact
   * @param {string} reply - the reply made by the campaign contact from the studio flow before creating the new conversation
   *  
   * Steps:
   * 1) gen token
   * 2) validate token
   * 3) check if conversation already exists
   * [if exists]
   *  TRUE 
   *    a) push reply message(s) to conversation
   *  FALE
   *    a) set conversation name
   *    b) add conversation admins
   *    c) push reply message(s) to conversation
  */

  genToken(req.body)
  .then(a => {
    validateToken(a.body)
    .then(() => {
      checkExistingSmsConversation(req.body)
      .then(b => {
        if(b.code !== 200) {
          // push reply message(s) to existing conversation
          /**
           * 
          */
          
        } else {
          // continue new conversation create flow
          newConversation(req.body)
          .then(() => {
            addAdminParticipants()
            .then()
            // error adding admin participants
            .catch(err => res.status(500).json(err));
          })
          // error creating new conversation
          .catch(err => res.status(500).json(err));
        }
      })
      // check existing conversation error
      .catch(err => res.status(500).json(err));
    })
    // token validation error
    .catch(err => res.status(500).json(err));
  })
  // token generation error
  .catch(err => res.status(500).json(err));

});

module.exports = router;