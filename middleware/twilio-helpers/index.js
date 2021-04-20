// used to hold helper functions for use with twilio client functions

const config = require('../../config');

// Twilio
const twilio = require('twilio');
const client = new twilio(config.twilio.accountSid, config.twilio.authToken);

// Models
const User = require('../../models/user.model');

//----------------
const addAdminParticipants = (data) => {
  return new Promise((resolve, reject) => {
    User.find({
      role: 'admin'
    })
    .then(users => {
      for (var i = 0; i <= users.length; i++) {
        if (i < users.length) {
          client.conversations.conversations(data.conversationSid)
          .participants
          .create({
            identity: users[i].email
          })
          .catch(err => {
            console.error({
              message: "Error adding " + users[i].email + " to conversation " + data.conversationSid,
              err
            });
            throw {
              message: "Error adding " + users[i].email + " to conversation " + data.conversationSid
            };
          });
        } else if(i === users.length) {
          resolve({
            code: 200, 
            body: {
              conversationSid
            }
          });
        }
      }
    })
    .catch(err => {
      console.error({
        message: "Error getting admin users",
        err
      });
      throw {
        message: "Error getting admin users"
      };
    });
  });
};

const getParticipants = (data) => {
  return new Promise((resolve, reject) => {
    client.conversations.conversations(data.conversationSid)
    .participants
    .list
    .then(participants => {
      resolve({
        code: 200,
        body: { 
          participants
        }
      });
    })
    .catch(err => {
      console.error({
        message: "Error fetching conversation participants",
        err
      });
      throw {
        message: "Error fetching conversation participants"
      };
    });
  })
  .catch(err => {
    console.error({
      message: "Error processing getParticipants request: ",
      err
    });
    throw {
      message: "Error processing getParticipants request"
    };
  });
};

const newConversation = (data) => {
  return new Promise((resolve, reject) => {
    var messagingService;
    switch(data.messagingService) {
      case 'default':
        messagingService = config.twilio.messagingServiceSid;
        break;
      case 'automated':
        messagingService = config.twilio.automatedMessagingServiceSid;
        break;
      default:
        messagingService = config.twilio.messagingServiceSid;
        break;
    }
    client.conversations.conversations
    .create({
      messagingServiceSid: messagingService,
      friendlyName: data.friendlyName
    })
    .then(conversation => {
      resolve({
        code: 200,
        body: {
          conversation
        }
      });
    })
    .catch(err => {
      console.error({
        message: "Error trying to name conversation",
        err
      });
      throw {
        message: "Error trying to name conversation"
      };
    });
  })
  .catch(err => {
    console.error({
      message: "Error processing setConversationName request",
      err
    });
    throw {
      message: "Error processing setConversationName request"
    };
  });
};

const updateConversationName = (data) => {
  var thisFriendlyName = data.friendlyName || data.number;
  return new Promise((resolve, reject) => {
    client.conversations.conversations(data.conversationSid)
    .update({
      friendlyName: thisFriendlyName
    })
    .then(conversation => {
      resolve({
        code: 200,
        body: {
          conversation
        }
      });
    })
    .catch(err => {
      console.error({
        message: "Error updating conversation name",
        err
      });
      throw {
        message: "Error updating conversation name"
      };
    });
  });
};

const checkExistingSmsConversation = (data) => {
  return new Promise((resolve, reject) => {
    client.conversations.conversations
    .list
    .then(conversations => {
      for(var i=0; i<=conversations.length; i++) {
        if(i<conversations.length) {
          client.conversations.conversations(conversations[i].sid)
          .participants
          .list()
          .then(participants => {
            for(var j=0; j<=participants.length; j++) {
              if(j<participants.length) {
                // check if participant is sms and number matches data.number
                if(participants[i].messagingBinding) {
                  if(participants[i].messagingBinding.type === "sms") {
                    if(participants[i].messagingBinding.address === data.number || participants[i].messagingBinding.address === `+1${data.number}`) {
                      resolve({
                        code: 403,
                        body: {
                          message: "Conversation already exists for this user",
                          conversationSid: conversations[i].sid
                        }
                      });
                    }
                  }
                }
              } else if(j===participants.length) {
                continue;
              }
            }
          })
          .catch(err => {
            throw {
              message: "There was an error checking if this participant exists in the conversation"
            }
          });
        } else if(i===conversations.length) {
          resolve({
            code: 200,
            body: {
              message: "conversation does not exist yet"
            }
          })
        }
      }
    })
    .catch(err => {
      console.error({
        message: "Error checking for existing conversation",
        err
      });
      throw {
        message: "Error checking for existing conversation"
      };
    })
  });
};

const deleteConversation = (data) => {
  return new Promise((resolve, reject) => {
    client.conversations.conversations(data.conversationSid)
    .remove()
    .then(()=>{
      resolve({
        code: 200,
        body: {
          message: "Conversation successfully deleted"
        }
      })
    })
    .catch(err => {
      console.error({
        message: "Error deleting conversation",
        err
      });
      throw {
        message: "Error deleting conversation"
      };
    });
  });
};

const validatePhone = (data) => {
  return new Promise((resolve, reject) => {
    client.lookups.phoneNumbers(data.number)
    .fetch({
      countryCode: 'US',
      type: ['carrier']
    })
    .then(number => {
      if(number.carrier.type !== "mobile") {
        console.log();
        resolve({
          code: 403,
          body: {
            message: "Number is not a valid mobile number" 
          }
        });
      } else {
        resolve({
          code: 200,
          body: {
            message: "Number is valid mobile number"
          }
        });
      }
    })
    .catch(err => {
      console.error({
        message: "Error validating phone number",
        err
      });
      throw {
        message: "Error validating phone number"
      };
    })
  });
};

const triggerStudioFlow = (data, isJsonReq) => {
  return new Promise((resolve, reject) => {
    var params;
    function filterParams() {
      if(isJsonReq) {
        params = data.paramters;
      } else {
        for(const [key, value] of Object.entries(data)) {
          if(key.includes("param_")) {
            var thisKey = key.replace("param_", "");
            params[thisKey] = value;
          }
        }
      }
    }
    filterParams();
    var twilioNumber;
    switch(data.twilioNumber) {
      case 'default':
        twilioNumber = config.twilio.number;
        break;
      case 'automated':
        twilioNumber = config.twilio.automatedNumber;
        break;
      default:
        twilioNumber = config.twilio.number;
        break;
    }
    client.studio.flows(data.flowSid)
    .executions
    .create({
      paramters: {
        params
      },
      to: data.number, 
      from: twilioNumber
    })
    .then(execution => {
      resolve({
        code: 200,
        body: {
          message: "Flow successfully created",
          execution
        }
      });
    })
    .catch(err => {
      console.error({
        message: "Error triggering studio execution",
        err
      });
      throw {
        message: "There was an error triggering the studio execution"
      };
    });
  });
};

const triggerStudioWebhook = (data) => {
  return new Promise((resolve, reject) => {
    client.conversations.conversations(data.conversationSid)
    .webhooks
    .create({
      "configuration.flowSid": data.flowSid,
      "configuration.replayAfter": 0,
      target: "studio"
    })
    .then(webhook => {
      resolve({
        code: 200,
        body: {
          message: "Webhook executed successfully",
          webhook
        }
      });
    })
    .catch(err => {
      console.error({
        message: "Error triggering studio flow webhook",
        err
      });
      throw {
        message: "Error triggering studio flow webhook"
      }
    });
  });
};

module.exports = {
  addAdminParticipants,
  getParticipants,
  newConversation,
  updateConversationName,
  checkExistingSmsConversation,
  deleteConversation,
  validatePhone,
  triggerStudioFlow,
  triggerStudioWebhook
};