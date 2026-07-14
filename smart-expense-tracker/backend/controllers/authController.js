const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

// Helper to sign JWT tokens (24 hours expiry as per R-AUTH-5)
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_jwt_token_for_smart_expense_tracker_12345', {
    expiresIn: process.env.JWT_EXPIRE || '24h',
  });
};

// @desc    Register new user account
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error('Please fill in all registration fields');
    }

    // R-AUTH-2: Password complexity validation
    // Enforce minimum 8 chars, at least 1 uppercase, 1 lowercase, 1 number, 1 special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!passwordRegex.test(password)) {
      res.status(400);
      throw new Error(
        'Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
      );
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      throw new Error('User account already registered with this email address');
    }

    // Create user in database
    const user = await User.create({
      name,
      email,
      password,
    });

    if (user) {
      res.status(201).json({
        success: true,
        token: generateToken(user._id),
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          profilePicture: user.profilePicture,
        },
      });
    } else {
      res.status(400);
      throw new Error('Invalid user details received');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Login and authenticate user credentials
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error('Please enter both email address and password');
    }

    // Retrieve user and explicitly select password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      res.status(401);
      throw new Error('Invalid email or password credentials');
    }

    // Check if user account lockout period is active
    if (user.isLocked()) {
      const remainingMs = user.lockoutUntil - Date.now();
      const remainingMin = Math.ceil(remainingMs / 1000 / 60);
      res.status(403);
      throw new Error(
        `Account temporarily locked due to excessive failed attempts. Please retry in ${remainingMin} minute(s).`
      );
    }

    // Verify password matches hash
    const isMatch = await user.matchPassword(password);

    if (isMatch) {
      // Reset failed login fields on success
      user.failedLoginAttempts = 0;
      user.lockoutUntil = null;
      await user.save();

      res.status(200).json({
        success: true,
        token: generateToken(user._id),
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          profilePicture: user.profilePicture,
        },
      });
    } else {
      // Increment failed login count
      user.failedLoginAttempts += 1;

      // Lock account for 15 mins after 5 failed attempts (R-AUTH-8)
      if (user.failedLoginAttempts >= 5) {
        user.lockoutUntil = Date.now() + 15 * 60 * 1000;
        user.failedLoginAttempts = 0; // Reset counter for next cycle
        await user.save();

        res.status(403);
        throw new Error(
          'Maximum failed attempts reached. Your account has been temporarily locked for 15 minutes.'
        );
      } else {
        await user.save();
        const attemptsLeft = 5 - user.failedLoginAttempts;
        res.status(401);
        throw new Error(
          `Invalid email or password credentials. You have ${attemptsLeft} attempt(s) remaining before lockout.`
        );
      }
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile session details
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      res.status(200).json({
        success: true,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          profilePicture: user.profilePicture,
          createdAt: user.createdAt,
        },
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile configurations
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;

      if (req.body.password) {
        // Enforce password complexity rules on change as well
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
        if (!passwordRegex.test(req.body.password)) {
          res.status(400);
          throw new Error('New password does not meet required strength criteria');
        }
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.status(200).json({
        success: true,
        token: generateToken(updatedUser._id),
        user: {
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          profilePicture: updatedUser.profilePicture,
        },
      });
    } else {
      res.status(404);
      throw new Error('User session not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Request password reset OTP code
// @route   POST /api/auth/forgotpassword
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400);
      throw new Error('Please enter your email address');
    }

    const user = await User.findOne({ email });

    // R-AUTH-9: To prevent user enumeration attacks, if user does not exist, return a generic success/info message rather than "User not found"
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If a matching account exists, a password reset OTP has been sent to the email address.',
      });
    }

    // Generate random 6 digit code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in user document with 10 mins expiry
    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpire = Date.now() + 10 * 60 * 1000;
    await user.save();

    // Send the email
    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset OTP - Smart Expense Tracker',
        otp: otp,
      });

      res.status(200).json({
        success: true,
        message: 'A password reset OTP has been sent to your email address.',
      });
    } catch (err) {
      console.error('Email sending error:', err);

      // In development mode, log OTP to console and proceed as success to allow testing/dev
      if (process.env.NODE_ENV === 'development') {
        console.warn('[DEVELOPMENT ONLY] SMTP configuration failed. Logging OTP code below:');
        console.warn(`[OTP CODE]: ${otp} for email ${user.email}`);

        return res.status(200).json({
          success: true,
          message: 'A password reset OTP has been generated (logged to console in development mode).',
        });
      }

      // Clear fields if email send fails
      user.resetPasswordOTP = null;
      user.resetPasswordOTPExpire = null;
      await user.save();

      res.status(500);
      throw new Error('Email sending failed. Please try again later.');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Verify password reset OTP code correctness
// @route   POST /api/auth/verifyotp
// @access  Public
const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400);
      throw new Error('Please provide both email address and OTP code');
    }

    const user = await User.findOne({ email });

    if (!user || user.resetPasswordOTP !== otp || user.resetPasswordOTPExpire < Date.now()) {
      res.status(400);
      throw new Error('Invalid or expired OTP code');
    }

    res.status(200).json({
      success: true,
      message: 'OTP code verified successfully. You may now reset your password.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password using verified OTP code
// @route   POST /api/auth/resetpassword
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password) {
      res.status(400);
      throw new Error('Please provide all details: email, OTP code, and new password');
    }

    const user = await User.findOne({ email });

    if (!user || user.resetPasswordOTP !== otp || user.resetPasswordOTPExpire < Date.now()) {
      res.status(400);
      throw new Error('Invalid or expired OTP code');
    }

    // Enforce same password complexity validation rules as registration
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!passwordRegex.test(password)) {
      res.status(400);
      throw new Error(
        'Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
      );
    }

    // Set new password (will be hashed by pre-save hook)
    user.password = password;

    // Reset OTP fields
    user.resetPasswordOTP = null;
    user.resetPasswordOTPExpire = null;

    // Also reset login lockout if any
    user.failedLoginAttempts = 0;
    user.lockoutUntil = null;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload profile picture
// @route   POST /api/auth/profile-picture
// @access  Private
const uploadProfilePicture = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error('Please upload an image file');
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Set profile picture URL
    const imageUrl = `/uploads/profiles/${req.file.filename}`;
    user.profilePicture = imageUrl;

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile picture updated successfully',
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        profilePicture: updatedUser.profilePicture,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  forgotPassword,
  verifyOTP,
  resetPassword,
  uploadProfilePicture,
};
