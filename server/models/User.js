const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  enroll: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  hostelcode: { type: String },
  hostelname: { type: String },
  floor: { type: String },
  roomno: { type: String },
});

module.exports = mongoose.model('User', userSchema);
