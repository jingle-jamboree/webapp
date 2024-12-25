const User = require('../models/User');


exports.getUserInfo = async (req, res) => {
  const user = req.user
  return res.status(200).json({ 
    enroll: user.enroll, 
    name: user.name, 
    email: user.email, 
    phone: user.phone, 
    hostelcode: user.hostelcode, 
    room: user.roomno 
  });
};
