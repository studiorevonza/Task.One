const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roleAuth');

// Admin route: Assign task to user
router.post('/assign/:taskId/to/:userId', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { taskId, userId } = req.params;

    // Validate that the task and user exist
    const [task, user] = await Promise.all([
      Task.findById(taskId),
      User.findById(userId)
    ]);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Assign the task to the user
    task.assigned_to = userId;
    task.assigned_by = req.user.id; // Current admin assigning the task
    task.assigned_at = new Date();

    // Add task to user's assigned_tasks array
    user.assigned_tasks.push(taskId);
    await user.save();

    await task.save();

    // Emit real-time notification to the assigned user
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${userId}`).emit('taskAssigned', {
        message: `A new task "${task.title}" has been assigned to you`,
        task: task
      });
    }

    res.status(200).json({
      success: true,
      message: 'Task assigned successfully',
      data: task
    });
  } catch (error) {
    console.error('Error assigning task:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while assigning task',
      error: error.message
    });
  }
});

// Admin route: Get all users with their assigned tasks
router.get('/users-with-tasks', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const users = await User.find({ role: 'user' })
      .populate({
        path: 'assigned_tasks',
        populate: {
          path: 'assigned_by',
          select: 'name email'
        }
      })
      .select('-password')
      .lean();

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users with tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users with tasks',
      error: error.message
    });
  }
});

// Admin route: Get all tasks assigned by admin
router.get('/assigned-by-me', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const tasks = await Task.find({ assigned_by: req.user.id })
      .populate('assigned_to', 'name email')
      .populate('assigned_by', 'name email');

    res.status(200).json({
      success: true,
      data: tasks
    });
  } catch (error) {
    console.error('Error fetching assigned tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching assigned tasks',
      error: error.message
    });
  }
});

module.exports = router;