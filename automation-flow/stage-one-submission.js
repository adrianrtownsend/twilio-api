// twilio function to post new stage one sms submissions

exports.handler = function(context, event, callback) {
  const axios = require('axios');
  let response = new Twilio.Response();

  axios.post(`${context.MDH_API_URL}/gravityForms/submission`, {
    formId: context.GF_STAGE_1,
    fields: {
      firstname: '',
      lastname: '',
      phone: '',
      email: '',

    }
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
    
    callback(null, response);
  })
  .catch(err => {
    callback({
      message: "Error creating new stage 1 submission",
      err: error || err
    });
    console.log(err);
  });
}