const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema ({
  firstname: {
    type: String,
    required: true,
    trim: true,
    min: 3,
    max: 50
  },
  lastname: {
    type: String,
    required: true,
    trim: true,
    min: 3,
    max: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    min: 3,
    max: 50
  },
  passHash: {
      type: String,
      required: true,
      max: 1024,
      min: 6
  },
  role: {
    type: String,
    required: true,
    trim: true,
    min: 3,
    max: 50
  },
},
{
    timestamps: true
});

const User = mongoose.model('User', userSchema);

module.exports = User;