const mongoose = require('mongoose');

const SCOPES = ['frontend', 'backend', 'admin'];

const envVaultSchema = new mongoose.Schema(
  {
    scope: {
      type: String,
      required: true,
      enum: SCOPES,
      index: true,
    },
    key: {
      type: String,
      required: true,
      maxlength: 200,
      trim: true,
    },
    value: {
      type: String,
      default: '',
      maxlength: 10000,
    },
    isSecret: {
      type: Boolean,
      default: true,
      index: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

envVaultSchema.index({ scope: 1, key: 1 }, { unique: true });

envVaultSchema.statics.SCOPES = SCOPES;

module.exports = mongoose.model('EnvVault', envVaultSchema);
