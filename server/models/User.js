import mongoose from 'mongoose';

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

const User = mongoose.model('User', userSchema);
export default User;
