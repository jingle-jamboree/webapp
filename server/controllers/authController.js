import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { StudentLogin, GetPersonalInfo, GetHostelInfo } from 'jsjiit-server';

/**
 * Capitalizes first letter of each word in a string
 * @param {string} str - Input string
 * @returns {string} Capitalized string
 */
const capitalize = (str) => {
  return str.toLowerCase().replace(/\b\w/g, function (char) {
    return char.toUpperCase();
  });
}

/**
 * Creates a new user account after validating with JIIT web portal
 * @param {string} username - Enrollment number
 * @param {string} password - User's password
 * @returns {Promise<boolean>} Success status
 */
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

/**
 * Generates JWT token for authentication
 * @param {string} userId - MongoDB user ID
 * @returns {string} JWT token
 */
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    {
      expiresIn: '15m',  // Short-lived access token
      algorithm: 'HS256',
      issuer: 'jiit-tools',
      audience: 'jiit-webapp'
    }
  );
};

/**
 * Handles user login with JIIT credentials
 * Creates new account if user doesn't exist
 */
export const login = async (req, res) => {
  try {
    const { enroll, password } = req.body;
    if (!enroll || !password) {
      return res.status(400).json({
        message: 'Email and password are required.'
      });
    }

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
    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET,
      {
        expiresIn: '30d', // 30 day refresh token
        algorithm: 'HS256',
        issuer: 'jiit-tools',
        audience: 'jiit-webapp'
      }
    );

    // Set token cookies with proper flags
    res.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    return res.status(200).json({
      message: 'Login successful.',
      token,
      refreshToken
    });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({
      message: error.message || 'Internal server error.'
    });
  }
};

/**
 * Refreshes access token using refresh token
 * @returns {Object} New access token
 */
export const refreshToken = (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token is required.' });
  }

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, {
      issuer: 'jiit-tools',
      audience: 'jiit-webapp',
      algorithms: ['HS256']
    });

    const newToken = generateToken(payload.userId);

    res.cookie('access_token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000
    });

    return res.status(200).json({ token: newToken });
  } catch (error) {
    console.error('Error during token refresh:', error);
    return res.status(401).json({ message: 'Invalid or expired refresh token.' });
  }
};

export { signup, generateToken };
