/**
 * Push number and information to new conversation 
 * in default conversation service.
 * Should just be post request with [phone, name, campaign]
*/

/**
 * Need a different messaging service w/ different phone number
 */

 exports.handler = function(context, event, callback) {
  const axios = require('axios');
	let response = new Twilio.Response();

  axios.post(`${context.MDH_API_URL}/api/genToken`,{
    kid: context.MDH_API_KID,
    secret: context.MDH_API_SECRET
  })
  .then(res => {
    var token = res.data.token;
    axios.post(`${context.MDH_API_URL}/api/checkConversationsSms`,{
      token: token,
      secretType: context.MDH_API_SECRETTYPE,
      number: event.number,
      campaign: event.campaign,
      friendlyName: event.friendlyName,
      firstname: event.firstname,
      lastname: event.lastname,
      reply: event.reply
    })
    .then(() => {
      // Set the status code to 200 OK
      response.setStatusCode(200);
      
      // Set the Content-Type Header
      response.appendHeader('Content-Type', 'application/json');
      
      // Set the response body
      response.setBody({
        'message': 'success'
      });
      return callback(null, response);
    })
    .catch(err => {
      console.log({
        message: "Error handling message reply function",
        err: err
      });
      return callback({
        message: "Error handling message reply function",
        err: err
      });
    });
  })
  .catch(err => {
    console.log({
      message: "Error validating api credentials",
      err: err
    });
    return callback({
      message: "Error validating api credentials",
      err: err
    });
  });
	
}