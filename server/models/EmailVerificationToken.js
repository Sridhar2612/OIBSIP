const mongoose = require('mongoose');

const emailVerificationTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    token: {
      type: String,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: '24h' } // Auto TTL expiration
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('EmailVerificationToken', emailVerificationTokenSchema);
