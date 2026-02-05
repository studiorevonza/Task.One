const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roleAuth');

// User route: Get tasks assigned to the current user
router.get('/my-assigned', authenticateToken, async (req, res) => {
  try {
    const tasks = await Task.find({ 
      assigned_to: req.user.id 
    })
    .populate('assigned_by', 'name email')
    .populate('assigned_to', 'name email')
    .sort({ createdAt: -1 });

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

// User route: Update task status
router.put('/update-status/:taskId', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, notes } = req.body;

    // Validate status
    const validStatuses = ['todo', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Valid statuses are: todo, in_progress, completed, cancelled'
      });
    }

    // Find the task and ensure it's assigned to the current user
    const task = await Task.findOne({ 
      _id: taskId, 
      assigned_to: req.user.id 
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or not assigned to you'
      });
    }

    // Update task status
    const previousStatus = task.status;
    task.status = status;
    task.updated_by = req.user.id;

    // Add to progress updates
    task.progress_updates.push({
      status: status,
      updated_by: req.user.id,
      updated_at: new Date(),
      notes: notes || ''
    });

    await task.save();

    // Emit real-time update to admin who assigned the task
    const io = req.app.get('io');
    if (io && task.assigned_by) {
      io.to(`user_${task.assigned_by}`).emit('taskUpdated', {
        message: `Task "${task.title}" status changed from ${previousStatus} to ${status}`,
        task: task
      });
    }

    res.status(200).json({
      success: true,
      message: 'Task status updated successfully',
      data: task
    });
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating task status',
      error: error.message
    });
  }
});

// User route: Add progress notes to task
router.put('/add-notes/:taskId', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { notes } = req.body;

    if (!notes || notes.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Notes are required'
      });
    }

    // Find the task and ensure it's assigned to the current user
    const task = await Task.findOne({ 
      _id: taskId, 
      assigned_to: req.user.id 
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or not assigned to you'
      });
    }

    // Add to progress updates
    task.progress_updates.push({
      status: task.status,
      updated_by: req.user.id,
      updated_at: new Date(),
      notes: notes
    });

    await task.save();

    // Emit real-time update to admin who assigned the task
    const io = req.app.get('io');
    if (io && task.assigned_by) {
      io.to(`user_${task.assigned_by}`).emit('taskProgress', {
        message: `New progress notes added to task "${task.title}"`,
        task: task
      });
    }

    res.status(200).json({
      success: true,
      message: 'Progress notes added successfully',
      data: task
    });
  } catch (error) {
    console.error('Error adding progress notes:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding progress notes',
      error: error.message
    });
  }
});

module.exports = router;