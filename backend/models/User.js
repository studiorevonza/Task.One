const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: false // Optional for Google Auth users
  },
  role: {
    type: String,
    default: 'Product Designer'
  },
  avatar_url: {
    type: String,
    default: ''
  },
  location: String,
  bio: String,
  website: String,
  two_factor_enabled: {
    type: Boolean,
    default: false
  },
  notifications_enabled: {
    type: Boolean,
    default: true
  },
  reset_token: String,
  reset_token_expires: Date,
  googleId: String
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Transform _id to id
userSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
    delete ret.password; // Don't return password
  }
});

// Match password method
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Pre-save hook to hash password if modified
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', userSchema);
