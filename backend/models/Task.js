const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  status: {
    type: String,
    enum: ['todo', 'in_progress', 'completed', 'cancelled'],
    default: 'todo'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  due_date: Date,
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assigned_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Admin who assigned the task
    required: false
  },
  assigned_to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // User who receives the task
    required: false
  },
  assigned_at: {
    type: Date,
    default: Date.now
  },
  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Last person who updated the task
  },
  progress_updates: [{
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'completed', 'cancelled']
    },
    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updated_at: {
      type: Date,
      default: Date.now
    },
    notes: String
  }]
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Transform _id to id
taskSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
  }
});

module.exports = mongoose.model('Task', taskSchema);