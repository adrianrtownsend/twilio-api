exports.handler = function(context, event, callback) {
  const axios = require('axios');

  axios.post(`${context.MDH_API_URL}/twilio/campaignConversationCreate`, {
    kid: context.MDH_API_KID,
    secret: context.MDH_API_SECRET,
    friendlyName: event.friendlyName,
    number: event.number,
    campaign: event.campaign,
    firstname: event.firstname,
    lastname: event.lastname,
    reply: event.reply
  })
  .then(() => {
    callback(null, "Success");
  })
  .catch(err => {
    console.log(err);
    callback(err);
  });

};