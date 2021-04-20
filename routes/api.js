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


// Register New Api Credentials
router.post('/register', async (request, response) => {

  // kid        - generated
  // secret     - generated
  // source     - request
  // secretType - request 


  // validate api-reister-password
  if (request.body.apiRegisterPwd !== config.apiRegisterPwd) {
    return response.status(500).json({
      message: "Invalid credentials for registering api credentials"
    });
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
    response.status(200).json({
      kid: newApiKey.kid,
      secret: newApiKey.secret
    });
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

// Generate Token from API Key/Secret
router.post('/genToken', async (request, response) => {

  // !!!!!!!!!! add method to encode string for comparison against db value

  // lookup ID and validate secret
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
        response.status(200).json({
          token: token
        });
      } else {
        response.status(403).json({
          message: "Invalid api credentials or expired token"
        });
        console.warn({
          message: "Could not validate client api credentials"
        });
      }
    })
    .catch(err => {
      response.status(500).json({
        message: "There was an error trying to validate your api credentials",
        err
      });
      console.error({
        message: "Error trying to validate api credentials",
        err
      });
    });
});

// New Conversation with SMS participant - create new conversation in DB and add sms participant
router.post('/newSmsConversation/:val', (request, response) => {

  /**
   * validate token
   * create conversation with name
   * add sms participant
   * add admin participants
   * push conversation to DB
  */

  var cSid;
  var cPhoneNumber;
  var cFriendlyName;
  var cParticipants;
  var cState;
  var cAttributes;

  function newConversationToDB() {
    // add conversation and everthing to DB
    const sid = cSid;
    const phoneNumber = cPhoneNumber;
    const friendlyName = cFriendlyName;
    const participants = cParticipants;
    const state = cState;
    const attributes = cAttributes;

    const newConversation = new Conversation({
      sid,
      phoneNumber,
      friendlyName,
      participants,
      state,
      attributes
    });

    newConversation.save()
    .then(() => {
      response.status(200).json({
        sid: sid,
        message: "New Conversation created for: " + request.body.number
      });
    })
    .catch(err => {
      response.status(500).json({
        message: "There was an error finalizing conversation setup",
        err
      });
      console.error({
        message: "Error adding new conversation data to DB",
        err
      });
    });
  }

  // validate token
  var token = request.body.token;
  jwt.verify(token, request.body.secretType, function (err, decoded) {

    if (!err) { 
      client.conversations.conversations
      .create({
        messagingServiceSid: config.twilio.messagingServiceSid,
        friendlyName: request.params.val
      })
      .then(conversation => {
        cSid = conversation.sid;
        cPhoneNumber = request.body.number;
        cFriendlyName = request.params.val;
        cState = "active";
        // add sms participant
        client.conversations.conversations(conversation.sid)
        .participants
        .create({
          'messagingBinding.address': request.body.number,
          'messagingBinding.proxyAddress': config.twilio.number
        })
        .then(participant => {
          // add admin participants to the conversation
          User.find({
            role: 'admin'
          })
          .then(users => {
            for(var i=0;i<=users.length;i++) {
              if(i===users.length) {
                newConversationToDB();
              } else if(i<users.length) {
                client.conversations.conversations(participant.conversationSid)
                .create({
                  identity: u.email
                })
                .then(participant => {
                  cParticipants.push({
                    sid: participant.sid,
                    identity: participant.identity
                  });
                })
                .catch(err => {
                  response.status(500).json({
                    message: "There was an error trying to attach one of our admins to the conversation",
                    err
                  });
                  console.error({
                    message: "Error trying to add " + u.email + " to conversation " + conversation.sid,
                    err
                  });
                });
              }
            }
          })
          .catch(err => {
            response.status(500).json({
              message: "There was an error fetching the admin users to add to the conversation",
              err
            });
            console.error({
              message: "Error fetching admin users to add to conversation",
              err
            });
          });
        })
        .catch(err => {
          response.status(500).json({
            message: "There was an error adding the sms participant to the conversation",
            err
          });
          console.error({
            message: "Error adding sms participant to conversation",
            err
          });
        })
      })
      .catch(err => {
        response.status(500).json({
          message: "There was an error creating the new conversation",
          err
        });
        console.error({
          message: "There was an error creating the new conversation",
          err
        });
      });
    } else {
      response.status(403).json(err);
      console.log({
        message: "Request not authorized",
        err
      });
    }

  });

});

// Return all admin users for automated conversation creation
router.post('/addAdminsToConversation', (request, response) => {
  var cSid;
  var cPhoneNumber;
  var cFriendlyName;
  var cParticipants;
  var cState;
  var cAttributes;

  function newConversationToDB() {
    // add conversation and everthing to DB
    const sid = cSid;
    const phoneNumber = cPhoneNumber;
    const friendlyName = cFriendlyName;
    const participants = cParticipants;
    const state = cState;
    const attributes = cAttributes;

    const newConversation = new Conversation({
      sid,
      phoneNumber,
      friendlyName,
      participants,
      state,
      attributes
    });

    newConversation.save()
    .then(() => {
      response.status(200).json({
        sid: conversation.sid,
        message: "New Conversation created for: " + request.body.number
      });
    })
    .catch(err => {
      response.status(500).json({
        message: "There was an error finalizing conversation setup",
        err
      });
      console.error({
        message: "Error adding new conversation data to DB",
        err
      });
    });
  }

  // verify token
  var token = request.body.token;
  jwt.verify(token, request.body.secretType, function (err, decoded) {
    if (!err) {
      cSid = request.body.conversationSid;
      cPhoneNumber = request.body.number;
      cFriendlyName = request.body.friendlyName;
      cState = "active";

      // run method to return admin users
      User.find({
        role: 'admin'
      })
      .then(users => {
        console.log("users", users);
        for(var i=0;i<=users.length;i++) {
          if(i===users.length) {
            newConversationToDB();
          } else if(i<users.length) {
            client.conversations.conversations(request.body.conversationSid)
            .create({
              identity: u.email
            })
            .then(participant => {
              cParticipants.push({
                sid: participant.sid,
                identity: participant.identity
              });
            })
            .catch(err => {
              response.status(500).json({
                message: "There was an error trying to attach one of our admins to the conversation",
                err
              });
              console.error({
                message: "Error trying to add " + u.email + " to conversation " + conversation.sid,
                err
              });
            });
          }
        }
      })
      .then(() => {
        response.status(200).json("Done");
        console.log("Done");
      })
      .catch(err => {
        response.status(500).json({
          message: "There was an error getting admin users to add to conversation",
          err
        });
        console.error({
          message: "Error getting admin user to add to conversation",
          err
        });
      });
    } else {
      response.status(403).json(err);
      console.log({
        message: "Response not authorized",
        err
      });
    }
  });

});

// ( ) Welcome Webhook to start Twilio studio flow
router.post('/welcomeWebhook', (request, response) => {

  /**
   * webhook steps
   * 1) set name
   * 2) add admins
   * 3) add webhook
  */

  client.conversations.conversations(request.body.conversationSid)
  .update({
    friendlyName: request.body.smsName
  })
  .then(() => {
    // add admins to conversation - do not move forward until last admin added
    User.find({
      role: 'admin'
    })
    .then(users => {
      // loop through users and after adding run end of function
      for (var i = 0; i <= users.length; i++) {
        if (i < users.length) {
          client.conversations.conversations(request.body.conversationSid)
            .participants
            .create({
              identity: u.email
            })
            .catch(err => {
              response.status(400).json({
                message: "There was an error trying to add one of our admins to the conversation",
                err
              });
              console.error({
                message: "Error trying to add " + u.email + " to " + request.body.conversationSid + " as a participant",
                err
              });
            });
        } else {
          // run next part
          client.conversations.conversations(request.body.conversationSid)
          .webhooks
          .create({
            "configuration.flowSid": request.body.webhookSid,
            "configuration.replayAfter": 0,
            target: "studio"
          })
          .then(webhook => {
            console.log({
              message: "Successfully created new conversation with webhook",
              webhook
            });
          })
          .catch(err => {
            response.status(500).json({
              message: "There was an error trying to trigger the webhook for the conversation",
              err
            });
            console.error({
              message: "Error trying to trigger webhook " + request.body.webhookSid + " for conversation " + requesrt.body.conversationSid,
              err
            });
          });
        }
      }
    })
    .catch(err => {
      response.status(500).json({
        message: "There was an error trying to get administrators to add to the conversation",
        err
      });
      console.error({
        message: "Error fetching admins to add to conversation",
        err
      });
    });
  })
  .catch(err => {
    response.status(500).json({
      message: "There was an error setting the name for conversation " + request.body.conversationSid,
      err
    });
    console.log({
      message: "Error setting friendlyName for conversation " + request.body.conversationSid,
      err
    });
  });

});

// Execute Studio flow Based on param
router.post('/triggerFlow/:val', (request, response) => {

  var flowId;
  switch(request.params.val) {
    case '':
      flowId = '';
      break;
    default:
      flowId = '';
      break;
  }

  client.studio.flows(flowId)
  .executions
  .create({to: request.body.phoneNumber, from: config.twilio.number})
  .then(execution => {
    response.status(200).json({
      message: "Successfully triggered studio execution"
    });
  })
  .catch(err => {
    response.status(500).json({
      message: "There was an error triggering the studio execution",
      err
    });
    console.error({
      message: "Error triggering studio execution",
      err
    });
  });
});

router.post('/checkConversationsSms', (request, response) => {

  function triggerReplyFlow() {
    client.studio.flows('FWcf2d60e1057d85b9128542a34ab53fee')
    .executions
    .create({
      parameters: {
        firstname: request.body.firstname
      },
      to: request.body.number,
      from: config.twilio.number
    })
    .then(execution => {
      response.status(200).json({
      message: "Reply function successfully executed"
      });
    })
    .catch(err => {
      response.status(500).json({
        message: "Error triggering flow to number",
        err
      });
    });
  }

  function pushToGForms() {
    var data = JSON.stringify({
      "input_1": request.body.number,
      "input_2": request.body.campaign,
      "input_3": `${request.body.firstname} ${request.body.lastname}`,
      "input_4": request.body.reply
    });

    var config = {
      method: 'post',
      url: `https://mydrhank.com/wp-json/gf/v2/forms/106/submissions`,
      headers: { 
        'Authorization': 'Basic Y2tfM2NkNjI5ZTkzNjlkMDM0ZDA4MDk1NWU0ZGYyYThiMjk0NTZmNjQwODpjc19iODlmZTY5M2NkM2QwMzNkODc1NWUzN2I5MWNhNmNhN2FjZTk4N2Mw', 
        'Content-Type': 'application/json', 
        'Cookie': '__cfduid=d9250a401f60ab406baa6942d89ab4d0d1606152323; wpe-auth=7dc389c81bd8c8a4a66ef00dd7c05674'
      },
      data : data
    };

    axios(config)
    .then(res => {
      triggerReplyFlow();
    })
    .catch(error => {
      response.status(500).json({
        message: "Error pushing conversation reply to gravity form",
        err: error || err
      });
      console.error({
        message: "Error pushing conversation reply to gravity forms",
        err: error || err
      });
    });
  }

  function addAdmins(conversationSid) {
    User.find({
      role: 'admin'
    })
    .then(users => {
      //console.log("users: ", users);
      for(var i=0;i<=users.length;i++) {
        if(i===users.length) {
          pushToGForms();
        } else if(i<users.length) {
          client.conversations.conversations(conversationSid)
          .participants
          .create({
            identity: users[i].email
          })
          .catch(err => {
            response.status(500).json({
              message: "There was an error trying to attach one of our admins to the conversation",
              err
            });
            console.error({
              message: "Error trying to add " + users[i].email + " to conversation " + conversation.sid,
              err
            });
          });
        }
      }
    })
    .catch(err => {
      response.status(500).json({
        message: "There was an error getting admin users to add to conversation",
        err
      });
      console.error({
        message: "Error getting admin user to add to conversation",
        err
      });
    });
  }

  function createConversation() {
    client.conversations.conversations
    .create({
      messagingServiceSid:config.twilio.messagingServiceSid,
      friendlyName: request.body.friendlyName
    })
    .then(conversation => {
      client.conversations.conversations(conversation.sid)
      .participants
      .create({
        'messagingBinding.address': request.body.number,
        'messagingBinding.proxyAddress':config.twilio.number
      })
      .then(participant => {
        addAdmins(participant.conversationSid);
      })
      .catch(err => {
        response.status(500).json({
          message: "Error adding sms participant to the conversation",
          err
        });
        console.log({
          message: "Error adding sms participant to the conversation",
          err
        });
      });
    })
    .catch(err => {
      response.status(500).json({
        message: "Error creating new conversation",
        err
      });
      console.log({
        message: "Error creating new conversation",
        err
      });
    }); 
  }

  // validate token
  var token = request.body.token;
  jwt.verify(token, request.body.secretType, function (err, decoded) {

    if (!err) { 
      client.conversations.conversations
      .list()
      .then(conversations => {

        for(var i=0;i<=conversations.length;i++) {
          if(i===conversations.length) {
            createConversation();
          } else if(i<conversations.length) {
            // check individual conversation's participants to see if sms participant matches
            client.conversations.conversations(conversations[i].sid)
            .participants
            .list()
            .then(participants => {
              
              for(var j=0;j<=participants.length;j++) {
                if(j===participants.length) {
                  continue;
                } else if(j<participants.length) {
                  if(participants[i].messagingBinding !== null) {
                    if(participants[i].messagingBinding.address === request.body.number || participants[i].messagingBinding.address === `+${request.body.number}`) {
                      // use this conversation - conversation[i].sid pushToGforms()
                      triggerReplyFlow();
                    }
                  }
                }
              }

            })
            .catch(err => {
              response.status(500).json({
                message: "Error checking participants for conversation " + conversations[i].sid,
                err
              });
              console.error({
                message: "Error checking participants for conversation " + conversations[i].sid,
                err
              });
            });

          }
        }

      })
      .catch(err => {
        response.status(500).json({
          message: "Error fetching all conversations",
          err
        });
        console.error({
          message: "Error fetching all conversations",
          err
        });
      });
    } else {
      response.status(403).json({
        message: "Request not authorized"
      });
    }
  });

});

router.post('/deleteConversation/:sid', (request, response) => {

  client.conversations.conversations(request.params.sid)
  .remove()
  .then(() => {
    response.status(200).json({
      message: "conversation deleted"
    });
  })
  .catch(err => {
    response.status(500).json({
      message: "There was an error deleting the conversation",
      err
    });
    console.error({
      message: "Error deleting conversation",
      err
    });
  });

});

module.exports = router;