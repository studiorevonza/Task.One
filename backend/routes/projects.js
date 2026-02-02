const express = require('express');
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');
const { authenticateToken } = require('../middleware/auth');
const { dbOperation, inMemoryOperations, isDbConnected } = require('../utils/dbHelper');

const router = express.Router();

// Validation middleware
const projectValidation = [
  body('name').notEmpty().trim().escape().withMessage('Project name is required'),
  body('description').optional().trim().escape(),
  body('color').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Invalid color format')
];

// Get all projects for user
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    let projects;
    if (isDbConnected()) {
      // Use database
      projects = await dbOperation(async () => {
        return await Project.find({ user: req.user.userId })
          .sort({ created_at: -1 });
      }, []);
    } else {
      // Use in-memory storage
      projects = inMemoryOperations.findProjectsByUserId(req.user.userId);
    }

    // If database is not connected, return empty array as fallback
    if (!projects || projects.length === 0) {
      return res.json({
        success: true,
        data: {
          projects: []
        }
      });
    }

    // For database results, populate task counts
    if (isDbConnected()) {
      // Populate task counts
      const projectsWithCounts = await Promise.all(projects.map(async (project) => {
        const taskCount = await dbOperation(async () => {
          return await Task.countDocuments({ project: project._id });
        }, 0);
        
        const completedCount = await dbOperation(async () => {
          return await Task.countDocuments({ project: project._id, status: 'completed' });
        }, 0);
        
        const pObj = project.toJSON();
        pObj.task_count = taskCount;
        pObj.completed_tasks = completedCount;
        return pObj;
      }));

      res.json({
        success: true,
        data: {
          projects: projectsWithCounts
        }
      });
    } else {
      // For in-memory, return projects as-is
      res.json({
        success: true,
        data: {
          projects: projects
        }
      });
    }

  } catch (error) {
    next(error);
  }
});

// Get single project with tasks
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    let project;
    if (isDbConnected()) {
      // Use database
      project = await dbOperation(async () => {
        return await Project.findOne({ _id: id, user: req.user.userId });
      });
    } else {
      // Use in-memory storage
      project = inMemoryOperations.findProjectById(id);
      // Check if it belongs to the current user
      if (project && project.user !== req.user.userId) {
        project = null;
      }
    }

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Get project tasks with assigned user info
    let tasks = [];
    if (isDbConnected()) {
      tasks = await dbOperation(async () => {
        return await Task.find({ project: id })
          .populate('assigned_to', 'name')
          .sort({ created_at: -1 });
      }, []);

      // Transform tasks to include assigned_to_name flat field if needed by frontend
      const tasksWithFlattenedUser = tasks.map(t => {
        const tObj = t.toJSON();
        if (t.assigned_to) {
          tObj.assigned_to_name = t.assigned_to.name;
        }
        return tObj;
      });

      res.json({
        success: true,
        data: {
          project: {
            ...project.toJSON(),
            tasks: tasksWithFlattenedUser
          }
        }
      });
    } else {
      // For in-memory, return project as-is
      res.json({
        success: true,
        data: {
          project: project
        }
      });
    }

  } catch (error) {
    next(error);
  }
});

// Create new project
router.post('/', authenticateToken, projectValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { name, description, color, category, priority, due_date } = req.body;

    let project;
    if (isDbConnected()) {
      // Use database
      project = await dbOperation(async () => {
        return await Project.create({
          name,
          description,
          color: color || '#3B82F6',
          category: category || 'company',
          priority: priority || 'medium',
          due_date,
          user: req.user.userId
        });
      });
    } else {
      // Use in-memory storage
      project = inMemoryOperations.createProject({
        name,
        description,
        color: color || '#3B82F6',
        category: category || 'company',
        priority: priority || 'medium',
        due_date,
        user: req.user.userId
      });
    }

    if (!project) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create project'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: {
        project
      }
    });

  } catch (error) {
    next(error);
  }
});

// Update project
router.put('/:id', authenticateToken, projectValidation, async (req, res, next) => {
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
    const { name, description, color, category, priority, due_date, progress } = req.body;

    let project;
    if (isDbConnected()) {
      // Use database
      project = await dbOperation(async () => {
        return await Project.findOneAndUpdate(
          { _id: id, user: req.user.userId },
          { 
            name, 
            description, 
            color, 
            category, 
            priority, 
            due_date, 
            progress 
          },
          { new: true, runValidators: true }
        );
      });
    } else {
      // For in-memory, we'll just return a success response since we can't really update
      // a project in the in-memory storage without a proper update method
      return res.status(500).json({
        success: false,
        message: 'Project updates require database connection'
      });
    }

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: {
        project
      }
    });

  } catch (error) {
    next(error);
  }
});

// Delete project
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    let project;
    if (isDbConnected()) {
      // Use database
      project = await dbOperation(async () => {
        return await Project.findOneAndDelete({ _id: id, user: req.user.userId });
      });
    } else {
      // For in-memory, we can't delete projects properly
      return res.status(500).json({
        success: false,
        message: 'Project deletion requires database connection'
      });
    }

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Delete associated tasks
    if (isDbConnected()) {
      await dbOperation(async () => {
        await Task.deleteMany({ project: id });
      });
    }

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });

  } catch (error) {
    next(error);
  }
});

// Get project statistics
router.get('/:id/stats', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verify project exists
    let project;
    if (isDbConnected()) {
      project = await dbOperation(async () => {
        return await Project.findOne({ _id: id, user: req.user.userId });
      });
    } else {
      project = inMemoryOperations.findProjectById(id);
      // Check if it belongs to the current user
      if (project && project.user !== req.user.userId) {
        project = null;
      }
    }

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Aggregate stats
    if (isDbConnected()) {
      const total_tasks = await dbOperation(async () => {
        return await Task.countDocuments({ project: id });
      }, 0);
      
      const todo_count = await dbOperation(async () => {
        return await Task.countDocuments({ project: id, status: 'todo' });
      }, 0);
      
      const in_progress_count = await dbOperation(async () => {
        return await Task.countDocuments({ project: id, status: 'in_progress' });
      }, 0);
      
      const completed_count = await dbOperation(async () => {
        return await Task.countDocuments({ project: id, status: 'completed' });
      }, 0);
      
      const high_priority_count = await dbOperation(async () => {
        return await Task.countDocuments({ project: id, priority: 'high' });
      }, 0);
      
      const overdue_count = await dbOperation(async () => {
        return await Task.countDocuments({ 
          project: id, 
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