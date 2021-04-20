const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const apiKeySchema = new Schema ({
  kid: {
    type: String,
    required: true,
    trim: true,
    min: 3,
    max: 50
  },
  secret: {
    type: String,
    required: true,
    trim: true,
    min: 3,
    max: 50
  },
  source: {
    type: String,
    required: true,
    trim: true,
    min: 3,
    max: 50
  },
  secretType: {
    type: String,
    required: true,
    trim: true,
    min: 3,
    max: 50
  }
});

const ApiKey = mongoose.model('ApiKey', apiKeySchema);

module.exports = ApiKey;