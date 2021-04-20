try {
  require('dotenv').config();
} catch (e) {
  console.error('error loading dotenv', e);
}

module.exports = {
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    apiKey: process.env.TWILIO_API_KEY,
    apiSecret: process.env.TWILIO_API_SECRET,
    chatServiceSid: process.env.TWILIO_CHAT_SERVICE_SID,
    number: process.env.TWILIO_NUMBER,
    automatedNumber: process.env.TWILIO_AUTOMATED_NUMBER,
    sendgridId: process.env.SENDGRID_API_KEY,
    semdgridEmail: process.env.SENDGRID_API_EMAIL,
    messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
    automatedMessagingServiceSid: process.env._TWILIO_AUTOMATED_MESSAGING_SERVICE_SID,
    stageOneFlow: process.env.TWILIO_STAGE_1_FLOW
  },
  gForms: {
    url: process.env.GFORMS_URL,
    auth: process.env.GFORMS_AUTH,
    cookie: process.env.GFORMS_COOKIE
  },
  atlas: process.env.ATLAS_URI,
  port: process.env.PORT,
  nodeEnv: process.env.NODE_ENV,
  apiRegisterPwd: process.env.API_REGISTER_PWD
}