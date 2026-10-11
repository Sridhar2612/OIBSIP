const crypto = require('crypto');
const User = require('../models/User');
const EmailVerificationToken = require('../models/EmailVerificationToken');
const PasswordResetToken = require('../models/PasswordResetToken');
const { generateToken } = require('../utils/jwt');
const sendEmail = require('../utils/sendEmail');

// @desc    Register a new customer
// @route   POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password.',
        error: 'VALIDATION_ERROR'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.',
        error: 'WEAK_PASSWORD'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
        error: 'EMAIL_ALREADY_EXISTS'
      });
    }

    // Never allow registration as admin through public API
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: 'user',
      isVerified: false,
      phone: phone || '',
      address: address || {}
    });

    // Generate secure verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    await EmailVerificationToken.create({
      user: user._id,
      token: verificationToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const verifyUrl = `${clientUrl}/verify-email?token=${verificationToken}`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; background-color: #1c1917; color: #f5f5f4; border-radius: 12px;">
        <h2 style="color: #f97316; margin-bottom: 8px;">Welcome to SliceCraft Pizza, ${user.name}! 🍕</h2>
        <p style="font-size: 15px; color: #d6d3d1;">Thank you for registering. Please confirm your email address to activate your account and start ordering delicious artisanal pizzas.</p>
        <div style="margin: 25px 0;">
          <a href="${verifyUrl}" style="background-color: #ea580c; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Verify Email Address</a>
        </div>
        <p style="font-size: 12px; color: #a8a29e;">This verification link will expire in 24 hours. If you did not create an account, please disregard this message.</p>
      </div>
    `;

    await sendEmail({
      to: user.email,
      subject: '🍕 Verify your email — SliceCraft Pizza',
      html: emailHtml
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful! We have sent a verification email. Please verify your account to log in.',
      data: {
        userId: user._id,
        email: user.email,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify customer email
// @route   POST /api/auth/verify-email
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required.',
        error: 'MISSING_TOKEN'
      });
    }

    const tokenDoc = await EmailVerificationToken.findOne({ token });
    if (!tokenDoc) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token. Please request a new one.',
        error: 'INVALID_TOKEN'
      });
    }

    if (tokenDoc.expiresAt < new Date()) {
      await EmailVerificationToken.deleteOne({ _id: tokenDoc._id });
      return res.status(400).json({
        success: false,
        message: 'Verification token has expired. Please request a new verification email.',
        error: 'TOKEN_EXPIRED'
      });
    }

    const user = await User.findById(tokenDoc.user);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User associated with this token was not found.',
        error: 'USER_NOT_FOUND'
      });
    }

    user.isVerified = true;
    await user.save();
    await EmailVerificationToken.deleteMany({ user: user._id });

    res.status(200).json({
      success: true,
      message: 'Your email has been successfully verified! You may now log in.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required.',
        error: 'MISSING_EMAIL'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a verification link has been sent.'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'This account is already verified. You can log in directly.',
        error: 'ALREADY_VERIFIED'
      });
    }

    await EmailVerificationToken.deleteMany({ user: user._id });

    const verificationToken = crypto.randomBytes(32).toString('hex');
    await EmailVerificationToken.create({
      user: user._id,
      token: verificationToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const verifyUrl = `${clientUrl}/verify-email?token=${verificationToken}`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; background-color: #1c1917; color: #f5f5f4; border-radius: 12px;">
        <h2 style="color: #f97316; margin-bottom: 8px;">SliceCraft Pizza Verification Link 🍕</h2>
        <p style="font-size: 15px; color: #d6d3d1;">Here is your requested email verification link.</p>
        <div style="margin: 25px 0;">
          <a href="${verifyUrl}" style="background-color: #ea580c; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Verify Email Address</a>
        </div>
        <p style="font-size: 12px; color: #a8a29e;">Expires in 24 hours.</p>
      </div>
    `;

    await sendEmail({
      to: user.email,
      subject: '🍕 New Verification Link — SliceCraft Pizza',
      html: emailHtml
    });

    res.status(200).json({
      success: true,
      message: 'A new verification email has been dispatched to your email address.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Customer Login
// @route   POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
        error: 'MISSING_CREDENTIALS'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
        error: 'INVALID_CREDENTIALS'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
        error: 'INVALID_CREDENTIALS'
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email address before logging in.',
        error: 'ACCOUNT_NOT_VERIFIED'
      });
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Login successful!',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          address: user.address,
          isVerified: user.isVerified
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Dedicated Admin Login
// @route   POST /api/auth/admin/login
const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both admin email and password.',
        error: 'MISSING_CREDENTIALS'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrative credentials.',
        error: 'ADMIN_ACCESS_DENIED'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrative credentials.',
        error: 'ADMIN_ACCESS_DENIED'
      });
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Admin authentication successful!',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address.',
        error: 'MISSING_EMAIL'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    // Prevent account enumeration by always returning success response
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If that email address is registered, a password reset link has been sent.'
      });
    }

    await PasswordResetToken.deleteMany({ user: user._id });

    const resetToken = crypto.randomBytes(32).toString('hex');
    await PasswordResetToken.create({
      user: user._id,
      token: resetToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; background-color: #1c1917; color: #f5f5f4; border-radius: 12px;">
        <h2 style="color: #f97316; margin-bottom: 8px;">Password Reset Request 🔐</h2>
        <p style="font-size: 15px; color: #d6d3d1;">You requested a password reset for your SliceCraft account. Click the button below to set a new password:</p>
        <div style="margin: 25px 0;">
          <a href="${resetUrl}" style="background-color: #ea580c; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p style="font-size: 12px; color: #a8a29e;">This link will expire in 1 hour. If you did not request this, please ignore this email.</p>
      </div>
    `;

    await sendEmail({
      to: user.email,
      subject: '🔐 Reset your password — SliceCraft Pizza',
      html: emailHtml
    });

    res.status(200).json({
      success: true,
      message: 'If that email address is registered, a password reset link has been sent.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.',
        error: 'INVALID_PASSWORD'
      });
    }

    const resetDoc = await PasswordResetToken.findOne({ token });
    if (!resetDoc) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token.',
        error: 'INVALID_TOKEN'
      });
    }

    if (resetDoc.expiresAt < new Date()) {
      await PasswordResetToken.deleteOne({ _id: resetDoc._id });
      return res.status(400).json({
        success: false,
        message: 'Password reset token has expired. Please request a new one.',
        error: 'TOKEN_EXPIRED'
      });
    }

    const user = await User.findById(resetDoc.user);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User associated with this reset token not found.',
        error: 'USER_NOT_FOUND'
      });
    }

    user.password = password; // pre-save hook will hash it
    await user.save();
    await PasswordResetToken.deleteMany({ user: user._id });

    res.status(200).json({
      success: true,
      message: 'Your password has been successfully reset! You can now log in.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  verifyEmail,
  resendVerification,
  login,
  adminLogin,
  forgotPassword,
  resetPassword,
  getMe
};
