const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const conversationSchema = new Schema({
  sid: {
    type: String,
    required: true,
    trim: true,
    min: 3,
    max: 20
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true,
    min: 10,
    max: 15
  },
  friendlyName: {
    type: String,
    required: true,
    trim: true,
    min: 3,
    max: 50
  },
  participants: [
    {
      sid: {
        type: String,
        required: true,
        trim: true,
        min: 3,
        max: 20
      },
      identity: {
        type: String,
        required: false,
        trim: true,
        min: 3,
        max: 40
      }
    }
  ],
  state: {
    type: String,
    required: true,
    trim: true,
    min: 3,
    max: 10
  },
  attributes: [
    {
      attributeKey: {
        type: String,
        required: true,
        trim: true,
        min: 3,
        max: 20
      },
      attributeValue: {
        type: String,
        required: true,
        trim: true,
        min: 3,
        max: 30
      }
    }
  ]
},
{
  timestamps: true
});

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;