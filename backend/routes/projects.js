const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

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
    const result = await db.query(`
      SELECT 
        p.*,
        COUNT(t.id) as task_count,
        COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks
      FROM projects p
      LEFT JOIN tasks t ON p.id = t.project_id
      WHERE p.user_id = $1
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `, [req.user.userId]);

    res.json({
      success: true,
      data: {
        projects: result.rows
      }
    });

  } catch (error) {
    next(error);
  }
});

// Get single project with tasks
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get project details
    const projectResult = await db.query(
      'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Get project tasks
    const tasksResult = await db.query(`
      SELECT 
        t.*,
        u.name as assigned_to_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.project_id = $1
      ORDER BY t.created_at DESC
    `, [id]);

    res.json({
      success: true,
      data: {
        project: {
          ...projectResult.rows[0],
          tasks: tasksResult.rows
        }
      }
    });

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

    const { name, description, color } = req.body;

    const result = await db.query(`
      INSERT INTO projects (name, description, color, user_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [name, description || null, color || '#3B82F6', req.user.userId]);

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: {
        project: result.rows[0]
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
    const { name, description, color } = req.body;

    // Check if project exists and belongs to user
    const existingProject = await db.query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );

    if (existingProject.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const result = await db.query(`
      UPDATE projects 
      SET name = $1, description = $2, color = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4 AND user_id = $5
      RETURNING *
    `, [name, description || null, color || '#3B82F6', id, req.user.userId]);

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: {
        project: result.rows[0]
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

    // Check if project exists and belongs to user
    const existingProject = await db.query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );

    if (existingProject.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Delete project (tasks will be set to NULL due to CASCADE)
    await db.query('DELETE FROM projects WHERE id = $1 AND user_id = $2', [id, req.user.userId]);

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

    // Verify project ownership
    const projectCheck = await db.query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const statsResult = await db.query(`
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'todo' THEN 1 END) as todo_count,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_count,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
        COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority_count,
        COUNT(CASE WHEN due_date < NOW() AND status != 'completed' THEN 1 END) as overdue_count
      FROM tasks 
      WHERE project_id = $1
    `, [id]);

    res.json({
      success: true,
      data: {
        stats: statsResult.rows[0]
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;