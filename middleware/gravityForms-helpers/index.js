// used to hold helper functions for use with gravity forms Rest Api
const config = require('../../config');

const axios = require('axios');

const pushToGForms = (data) => {
  return new Promise((resolve, reject) => {
    var gFormData = JSON.stringify(data.gFormData);

    var gFormConfig = {
      method: 'post',
      url: `${config.gForms.url}/${data.gFormId}/submissions`, // url + formId + 'submissions'
      headers: {
        'Authorization': `Basic ${config.gForms.auth}`,
        'Content-Type': 'application/json',
        'Cookie': `${config.gForms.cookie}`
      },
      data: gFormData
    };

    axios(gFormConfig)
    .then(res => {
      resolve({
        code: 200,
        body: {
          message: "Data successfully posted to form"
        }
      });
    })
    .catch(err => {
      console.error({
        message: "Error posting to gravity forms",
        err
      });
      throw {
        message: "Error posting to gravity forms"
      };
    });
  });
};

module.exports = {
  pushToGForms
};