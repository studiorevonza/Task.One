const express = require('express');
const { body, validationResult } = require('express-validator');

// Use global database if available, fallback to mock
const getDb = () => {
  return global.db || {
    query: async (sql, params) => {
      console.warn('⚠️ Database not connected - using in-memory storage');
      return [];
    }
  };
};

const db = getDb();
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
      WHERE p.user_id = ?
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `, [req.user.userId]);

    res.json({
      success: true,
      data: {
        projects: result
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
      'SELECT * FROM projects WHERE id = ? AND user_id = ?',
      [id, req.user.userId]
    );

    if (projectResult.length === 0) {
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
      WHERE t.project_id = ?
      ORDER BY t.created_at DESC
    `, [id]);

    res.json({
      success: true,
      data: {
        project: {
          ...projectResult[0],
          tasks: tasksResult
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
      VALUES (?, ?, ?, ?)
      
    `, [name, description || null, color || '#3B82F6', req.user.userId]);

    // Get the newly created project
    const newProject = await db.query(
      'SELECT * FROM projects WHERE id = LAST_INSERT_ID()',
      []
    );

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: {
        project: newProject[0]
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
      'SELECT id FROM projects WHERE id = ? AND user_id = ?',
      [id, req.user.userId]
    );

    if (existingProject.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    await db.query(`
      UPDATE projects 
      SET name = ?, description = ?, color = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `, [name, description || null, color || '#3B82F6', id, req.user.userId]);

    // Get the updated project
    const updatedProject = await db.query(
      'SELECT * FROM projects WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: {
        project: updatedProject[0]
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
      'SELECT id FROM projects WHERE id = ? AND user_id = ?',
      [id, req.user.userId]
    );

    if (existingProject.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Delete project (tasks will be set to NULL due to CASCADE)
    await db.query('DELETE FROM projects WHERE id = ? AND user_id = ?', [id, req.user.userId]);

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
      'SELECT id FROM projects WHERE id = ? AND user_id = ?',
      [id, req.user.userId]
    );

    if (projectCheck.length === 0) {
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
      WHERE project_id = ?
    `, [id]);

    res.json({
      success: true,
      data: {
        stats: statsResult[0]
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;