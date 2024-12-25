const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { StudentLogin, GetPersonalInfo, GetHostelInfo } = require('jsjiit-server');

const capitalize = (str) => {
  return str.toLowerCase().replace(/\b\w/g, function(char) {
    return char.toUpperCase();
  });
}
const signup = async (username, password) => {
  const session = await StudentLogin(username, password);
  const info = await GetPersonalInfo(session);
  const hostel = await GetHostelInfo(session);
  if (!session || !info) {
    return null;
  }

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  let userConfig = {
    enroll: username,
    password: hashedPassword,
    name: capitalize(info.generalinformation.studentname),
    email: info.generalinformation.studentpersonalemailid.toLowerCase(),
    phone: info.generalinformation.studentcellno,
  };


  if (hostel && Object.keys(hostel).length != 0 && hostel.presenthosteldetail && Object.keys(hostel.presenthosteldetail).length != 0) {
    userConfig = {
      ...userConfig,
      hostelcode: hostel.presenthosteldetail.hostelcode,
      hostelname: hostel.presenthosteldetail.hosteldescription,
      floor: hostel.presenthosteldetail.floor,
      roomno: hostel.presenthosteldetail.allotedroomno,
    };
  }

  const user = new User(userConfig);
  user.save();

  return true;
}

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });
};

exports.login = async (req, res) => {
  const { enroll, password } = req.body;
  if (!enroll || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const user = await User.findOne({ enroll });
    if (!user) {
      const webportalAuth = await signup(enroll, password);
      if (!webportalAuth) {
        return res.status(424).json({ message: 'Error occured while checking with WebPortal. Check credentials or try later.' });
      }
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = generateToken(user._id);
    const refreshToken = jwt.sign({ userId: user._id }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: '7d',
    });

    return res.status(200).json({ message: 'Login successful.', token, refreshToken });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.refreshToken = (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token is required.' });
  }

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const newToken = generateToken(payload.userId);

    return res.status(200).json({ token: newToken });
  } catch (error) {
    console.error('Error during token refresh:', error);
    return res.status(401).json({ message: 'Invalid or expired refresh token.' });
  }
};
