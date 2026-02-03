const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User'); // Imported for populating if needed
const { authenticateToken } = require('../middleware/auth');
const { dbOperation, inMemoryOperations, isDbConnected } = require('../utils/dbHelper');

const router = express.Router();

// Validation middleware
const taskValidation = [
  body('title').notEmpty().trim().escape().withMessage('Title is required'),
  body('description').optional().trim().escape(),
  body('status').optional().isIn(['todo', 'in_progress', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
  body('due_date').optional().isISO8601().withMessage('Invalid date format'),
  body('project_id').optional({ checkFalsy: true }).trim(), // Allow any string or null
  body('assigned_to').optional({ checkFalsy: true }).trim() // Allow any string or null
];

// Get all tasks for user with filters
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const {
      status,
      priority,
      project_id,
      search,
      page = 1,
      limit = 20,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    let tasks = [];
    if (isDbConnected()) {
      const filter = { user: req.user.userId };

      if (status) filter.status = status;
      if (priority) filter.priority = priority;
      if (project_id) filter.project = project_id;
      
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      const sortOption = {};
      if (sort_by) {
        sortOption[sort_by] = sort_order === 'asc' ? 1 : -1;
      } else {
        sortOption.created_at = -1;
      }

      tasks = await dbOperation(async () => {
        return await Task.find(filter)
          .populate('project', 'name color')
          .populate('assigned_to', 'name')
          .sort(sortOption)
          .skip((page - 1) * limit)
          .limit(parseInt(limit));
      }, []);

      const total = await dbOperation(async () => {
        return await Task.countDocuments(filter);
      }, 0);

      // Transform for frontend format expectations (flattening)
      const formattedTasks = tasks.map(t => {
        const obj = t.toJSON();
        if (t.project) {
          obj.project_name = t.project.name;
          obj.project_color = t.project.color;
        }
        if (t.assigned_to) {
          obj.assigned_to_name = t.assigned_to.name;
        }
        return obj;
      });

      res.json({
        success: true,
        data: {
          tasks: formattedTasks,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalItems: total,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } else {
      // For in-memory, return empty tasks
      res.json({
        success: true,
        data: {
          tasks: [],
          pagination: {
            currentPage: parseInt(page),
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    }

  } catch (error) {
    next(error);
  }
});

// Get single task
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      const task = await dbOperation(async () => {
        return await Task.findOne({ _id: id, user: req.user.userId })
          .populate('project', 'name color')
          .populate('assigned_to', 'name')
          .populate('user', 'name'); // Creator
      });

      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      const taskObj = task.toJSON();
      if (task.project) {
        taskObj.project_name = task.project.name;
        taskObj.project_color = task.project.color;
      }
      if (task.assigned_to) {
        taskObj.assigned_to_name = task.assigned_to.name;
      }
      if (task.user) {
        taskObj.creator_name = task.user.name;
      }

      res.json({
        success: true,
        data: {
          task: taskObj
        }
      });
    } else {
      // For in-memory, return not found
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

  } catch (error) {
    next(error);
  }
});

// Create new task
router.post('/', authenticateToken, taskValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { title, description, status, priority, due_date, project_id, assigned_to } = req.body;

    if (isDbConnected()) {
      const task = await dbOperation(async () => {
        return await Task.create({
          title,
          description,
          status: status || 'todo',
          priority: priority || 'medium',
          due_date,
          project: project_id || null,
          user: req.user.userId,
          assigned_to: assigned_to || null
        });
      });

      if (!task) {
        return res.status(500).json({
          success: false,
          message: 'Failed to create task'
        });
      }

      const populatedTask = await dbOperation(async () => {
        return await Task.findById(task._id)
          .populate('project', 'name color')
          .populate('assigned_to', 'name');
      });

      // Emit Real-time signal
      if (req.app.get('io')) {
        req.app.get('io').emit('neural_alert', {
          message: `System Alert: New Operational Unit initialized: "${title}"`,
          taskTitle: title
        });
      }

      const taskObj = populatedTask.toJSON();
      if (populatedTask.project) {
        taskObj.project_name = populatedTask.project.name;
        taskObj.project_color = populatedTask.project.color;
      }
      if (populatedTask.assigned_to) {
        taskObj.assigned_to_name = populatedTask.assigned_to.name;
      }

      res.status(201).json({
        success: true,
        message: 'Task created successfully',
        data: {
          task: taskObj
        }
      });
    } else {
      // For in-memory, return error since we can't create tasks without DB
      return res.status(500).json({
        success: false,
        message: 'Task creation requires database connection'
      });
    }

  } catch (error) {
    next(error);
  }
});

// Update task
router.put('/:id', authenticateToken, taskValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { title, description, status, priority, due_date, project_id, assigned_to } = req.body;

    if (isDbConnected()) {
      const task = await dbOperation(async () => {
        return await Task.findOneAndUpdate(
          { _id: id, user: req.user.userId },
          { 
            title, 
            description, 
            status, 
            priority, 
            due_date, 
            project: project_id || null, 
            assigned_to: assigned_to || null 
          },
          { new: true, runValidators: true }
        )
        .populate('project', 'name color')
        .populate('assigned_to', 'name');
      });

      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      // Emit Real-time signal
      if (req.app.get('io')) {
        req.app.get('io').emit('neural_alert', {
          message: `System Alert: Operational Unit "${title}" has been updated.`,
          taskTitle: title
        });
      }

      const taskObj = task.toJSON();
      if (task.project) {
        taskObj.project_name = task.project.name;
        taskObj.project_color = task.project.color;
      }
      if (task.assigned_to) {
        taskObj.assigned_to_name = task.assigned_to.name;
      }

      res.json({
        success: true,
        message: 'Task updated successfully',
        data: {
          task: taskObj
        }
      });
    } else {
      // For in-memory, return error since we can't update tasks without DB
      return res.status(500).json({
        success: false,
        message: 'Task updates require database connection'
      });
    }

  } catch (error) {
    next(error);
  }
});

// Delete task
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      const task = await dbOperation(async () => {
        return await Task.findOneAndDelete({ _id: id, user: req.user.userId });
      });

      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      res.json({
        success: true,
        message: 'Task deleted successfully'
      });
    } else {
      // For in-memory, return error since we can't delete tasks without DB
      return res.status(500).json({
        success: false,
        message: 'Task deletion requires database connection'
      });
    }

  } catch (error) {
    next(error);
  }
});

// Get task statistics
router.get('/stats/overview', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.userId;

    if (isDbConnected()) {
      const total_tasks = await dbOperation(async () => {
        return await Task.countDocuments({ user: userId });
      }, 0);
      const todo_count = await dbOperation(async () => {
        return await Task.countDocuments({ user: userId, status: 'todo' });
      }, 0);
      const in_progress_count = await dbOperation(async () => {
        return await Task.countDocuments({ user: userId, status: 'in_progress' });
      }, 0);
      const completed_count = await dbOperation(async () => {
        return await Task.countDocuments({ user: userId, status: 'completed' });
      }, 0);
      const cancelled_count = await dbOperation(async () => {
        return await Task.countDocuments({ user: userId, status: 'cancelled' });
      }, 0);
      const high_priority_count = await dbOperation(async () => {
        return await Task.countDocuments({ user: userId, priority: 'high' });
      }, 0);
      const overdue_count = await dbOperation(async () => {
        return await Task.countDocuments({ 
          user: userId, 
          due_date: { $lt: new Date() }, 
          status: { $ne: 'completed' } 
        });
      }, 0);

      res.json({
        success: true,
        data: {
          stats: {
            total_tasks,
            todo_count,
            in_progress_count,
            completed_count,
            cancelled_count,
            high_priority_count,
            overdue_count
          }
        }
      });
    } else {
      // For in-memory, return zero stats
      res.json({
        success: true,
        data: {
          stats: {
            total_tasks: 0,
            todo_count: 0,
            in_progress_count: 0,
            completed_count: 0,
            cancelled_count: 0,
            high_priority_count: 0,
            overdue_count: 0
          }
        }
      });
    }

  } catch (error) {
    next(error);
  }
});

module.exports = router;