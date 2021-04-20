const config = require('../config');
// Models
const User = require('../models/user.model');
const Conversation = require('../models/conversation.model');
const ApiKey = require('../models/apiKey.model');

// Middleware
const router = require('express').Router();
const mongoose = require('mongoose');

// Twilio
const twilio = require('twilio');
let client = new twilio(config.twilio.accountSid, config.twilio.authToken);

const logger = require('pino')();

const axios = require('axios');

// Auth
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


// Functions

// Generate new api token
function generateToken(req, res) {
  // lookup ID and validate secret
  ApiKey.findOne({
    kid: req.body.kid
  })
  .then(key => {
    if (key.secret === req.body.secret) {
      var token = jwt.sign({
        source: key.source
      }, key.secretType, {
        expiresIn: 120
      });
      return token;
    } else {
      returnRes(403, 'Invalid api credentials or expired token', null, 'Invalid api credentials or expired token', res);
    }
  })
  .catch(err => returnRes(500, 'Error trying to validate api credentials', err, 'Error trying to validate api credentials', err, res));

  ApiKey.findOne({
    kid: req.body.kid
  }, (err, key) => {
    if(err) return handleError(err);
    return key;
  });

}

// Validate exisisting api token
function validateToken(request) {
  var token = request.body.token;
  jwt.verify(token, request.body.secretType, function (err, decoded) { 
    if(!err) {
      return;
    } else {
      returnRes(403, 'Request not authorized', err);
    }
  });
}

// Post new entry to Gravity Forms instance
function postToGForms(formId, fields) {
  var data = {};
  
}

// Add default conversation admins
function AddAdmins(conversationSid, thisUser, request) {
  var c = {
    sid: '',
    phoneNumber: '',
    friendlyName: '',
    participants: [],
    state: '',
    attributes: []
  };

  c.sid = request.bodyConversationSid;
  c.phoneNumber = request.body.number;
  c.friendlyName = request.body.friendlyName;
  c.state = "active";

  User.find({
    role: 'admin'
  })
  .then(users => {
    for(var i=0;i<=users.length;i++) {
      if(i===users.length) {
        return c;
      } else if(i<users.length) {
        client.conversations.conversations(conversationSid)
        .create({
          identity: users[i].email
        })
        .then(participant => {
          c.participants.push({
            sid: participant.sid,
            identity: participant.identity
          });
        })
        .catch(err => returnRes(500, "There was an error trying to attach one of our admins to the conversation", err, "Error trying to add " + users[i].email + " to conversation " + conversationSid, err));
      }
    }
  })
  .catch(err => returnRes(500, "There was an error getting admin users to add to conversation", err, "There was an error getting admin users to add to conversation", err));
}

function validatePhone(number) {
  client.lookups.phoneNumbers(number)
  .fetch({
    countryCode: 'US',
    type: ['carrier']
  })
  .then(phoneNumber => {
    if(phoneNumber.carrier.type !== "mobile") {
      returnRes(403, number + " did not validate as a mobile number", null, number + " did not validate as a mobile number");
    }
  })
  .catch(err => returnRes(500, "Error checking carrier information for " + number, err, "Error checking carrier information for " + number, err));
}

function checkSmsExistingConversation(phone) {
  client.conversations.conversations
  .list()
  .then(conversations => {
    for(var i=0;i<=conversations.length;i++) {
      if(i===conversations.length) {

      } else if(i<conversations.length) {

      }
    }
  })
  .catch(err => returnRes(500, 'Error fetching conversations to check', err, 'Error fetching conversations to check', err));
}

function pushConversationToDb(c) {
  const sid = c.sid;
  const phoneNumber = c.phoneNumber;
  const friendlyName = c.friendlyName;
  const particpants = c.participants;
  const state = c.state;
  const attributes = c.attributes;

  const newConversation = new Conversation({
    sid,
    phoneNumber,
    friendlyName,
    participants,
    state,
    attributes
  });

  newConversation.save()
  .catch(err => returnRes(500, 'Error saving new conversation to db', err, 'Error saving new conversation to db', err));
}

function triggerStudioFlow(flowId, params, toNumber, fromNumber) {
  client.studio.flows(flowId)
  .executions
  .create({
    parameters: params,
    to: toNumber,
    from: fromNumber
  })
  .then(execution => execution)
  .catch(err => returnRes(500, 'Error triggering new automation flow', err, 'Error triggering new automation flow', err));
}


// Routes

// Register New Api Credentials
router.post('/register', async (request, response) => {

  // kid        - generated
  // secret     - generated
  // source     - request
  // secretType - request 


  // validate api-reister-password
  if (request.body.apiRegisterPwd !== config.apiRegisterPwd) {
    returnRes(403, 'Invalid credentials for registering api credentials');
  }

  // function to get random string
  function randomStr() {
    var randLen = Math.floor(Math.random() * 20) + 1;
    var arr = '01234569870abcdefghijklmnopqrstuvwxyz';
    var ans = '';
    for (var i = randLen; i > 0; i--) {
      ans +=
        arr[Math.floor(Math.random() * arr.length)];
    }
    return ans;
  }

  // call random string function // save string to pass back for api key & secret
  const salt = await bcrypt.genSalt(10);
  const genStr = randomStr();
  const kid = randomStr();
  const secret = await bcrypt.hash(genStr, salt);
  const source = request.body.source;
  const secretType = request.body.secretType;

  // genStr to client | hashStr to db
  const newApiKey = new ApiKey({
    kid,
    secret,
    source,
    secretType
  });

  newApiKey.save()
    .then(newApiKey => {
      returnRes(200, 'api key generated', {
        kid: newApiKey.kid,
        secret: newApiKey.secret
      }, false);
    })
    .catch(err => {
      response.status(500).json({
        message: "There was an error trying to register the new api credentials",
        err
      });
      console.error({
        message: "There was an error trying to register the new api credentials",
        err
      });
    });

});

// (_) Generate Token from API Key/Secret
router.post('/genToken', (request, response) => {
  ApiKey.findOne({
    kid: request.body.kid
  })
  .then(key => {
    if (key.secret === request.body.secret) {
      var token = jwt.sign({
        source: key.source
      }, key.secretType, {
        expiresIn: 120
      });
      returnRes(200, null, {token: token});
    } else {
      returnRes(403, 'Invalid api credentials or expired token', null, 'Invalid api credentials or expired token');
    }
  })
  .catch(err => returnRes(500, 'Error trying to validate api credentials', err, 'Error trying to validate api credentials', err));
});

// New SMS Conversation
router.post('/newSmsConversation/:val', (req, res) => {
  // auth check
  generateToken(req, res)
  .then(token=>{
    validateToken(token, req, res)
    .then(()=>{
      // execute normal route flow
    })
    .catch(err=>returnRes(500, 'Error running request to validate token', err, 'Error running request to validate token', err));
  })
  .catch(err => returnRes(500, 'Error running request to generate token', err, 'Error running request to generate token', err));
});

// Welcome Webhook to start Twilio studio flow
router.post('/welcomeWebhook', (request, response) => {

  // auth check
  generateToken(req, res)
  .then(token=>{
    validateToken(token, req, res)
    .then(()=>{
      // execute normal route flow
    })
    .catch(err=>returnRes(500, 'Error running request to validate token', err, 'Error running request to validate token', err));
  })
  .catch(err => returnRes(500, 'Error running request to generate token', err, 'Error running request to generate token', err));
  
});

// Execute Twilio Studio Flow
router.post('/triggerFlow/:val', (req, res) => {
  /**
   * generateToken
   * validateToken
   * triggerFlow based on params 
  */

  // auth check
  generateToken(req, res)
  .then(token => {
    validateToken(token, req, res)
    .then(() => {
      var toNumber = req.body.twilioNumberName === 'automated' ? config.twilio.automatedNumber : config.twilio.number;
      // execute normal route flow
      triggerStudioFlow(req.body.flowId, req.body.params, toNumber, req.body.number)
      .then(res => returnRes(200, 'Successfully triggered studio flow', res))
      .catch(err => returnRes(500, 'Error running request to trigger twilio studio flow', err, 'Error running request to trigger twilio studio flow', err));
    })
    .catch(err => returnRes(500, 'Error running request to validate token', err, 'Error running request to validate token', err));
  })
  .catch(err => returnRes(500, 'Error running request to generate token', err, 'Error running request to generate token', err));

});

// Delete a Conversation
/*router.post('/deleteConversation/:sid', (request, response) => {

   // Check if user is admin role
  //User.findOne({})
  client.conversations.conversations(request.params.sid)
    .remove()
    .then(conversation => response.status(200).json('conversation removed'))
    .catch(err => {
      response.status(500).json({
        message: 'Error deleting conversation: ',
        err
      });
      console.error("Error deleting conversation " + request.params.sid, err);
    });

});*/

module.exports = router;