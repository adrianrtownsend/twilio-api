// used to generate and validate session tokens
const ApiKey = require('../models/apiKey.model');

const jwt = require('jsonwebtoken');

const genToken = function(data, res) {
  return new Promise((resolve, reject) => {
    ApiKey.findOne({
      kid: data.kid
    })
    .then(key => {
      if (key.secret === data.secret) {
        var token = jwt.sign({
          source: key.source
        }, key.secretType, {
          expiresIn: 120
        });
        resolve({ code: 200, body: {token: token }});
      } else {
        console.warn({
          message: "Could not validate client api credentials"
        });
        resolve({
          code: 403,
          message: "Invalid api credentials or expired token"
        });
      }
    })
    .catch(err => {
      console.error({
        message: "Error trying to validate api credentials",
        err
      });
      throw {
        message: "There was an error trying to validate your api credentials"
      };
    });
  });
};

const validateToken = function(data, res) {
  var token = data.token;
  jwt.verify(token, data.secretType, function(err, decoded) {
    if(!err) {
      resolve({code: 200});
    } else {
      throw {
        message: "Invalid api token/credentials"
      };
    }
  });
}

module.exports = {
  genToken,
  validateToken
};