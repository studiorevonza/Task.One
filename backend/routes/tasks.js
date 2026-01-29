const express = require('express');
const { body, query, validationResult } = require('express-validator');

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
const taskValidation = [
  body('title').notEmpty().trim().escape().withMessage('Title is required'),
  body('description').optional().trim().escape(),
  body('status').optional().isIn(['todo', 'in_progress', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
  body('due_date').optional().isISO8601().withMessage('Invalid date format'),
  body('project_id').optional().isInt().withMessage('Project ID must be a number'),
  body('assigned_to').optional().isInt().withMessage('Assigned to must be a number')
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

    // Build query dynamically
    let queryText = `
      SELECT 
        t.id,
        t.title,
        t.description,
        t.status,
        t.priority,
        t.due_date,
        t.project_id,
        t.assigned_to,
        t.created_at,
        t.updated_at,
        p.name as project_name,
        p.color as project_color,
        u.name as assigned_to_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.user_id = ?
    `;
    
    const queryParams = [req.user.userId];

    // Add filters
    if (status) {
      queryText += ` AND t.status = ?`;
      queryParams.push(status);
    }

    if (priority) {
      queryText += ` AND t.priority = ?`;
      queryParams.push(priority);
    }

    if (project_id) {
      queryText += ` AND t.project_id = ?`;
      queryParams.push(parseInt(project_id));
    }

    if (search) {
      queryText += ` AND (t.title LIKE ? OR t.description LIKE ?)`;
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    // Add sorting
    const validSortColumns = ['created_at', 'updated_at', 'due_date', 'title', 'priority'];
    const validSortOrders = ['asc', 'desc'];
    
    if (validSortColumns.includes(sort_by) && validSortOrders.includes(sort_order)) {
      queryText += ` ORDER BY t.${sort_by} ${sort_order.toUpperCase()}`;
    } else {
      queryText += ' ORDER BY t.created_at DESC';
    }

    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    queryText += ` LIMIT ? OFFSET ?`;
    queryParams.push(parseInt(limit), offset);

    const result = await db.query(queryText, queryParams);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as count FROM tasks t WHERE t.user_id = ?';
    const countParams = [req.user.userId];

    if (status) {
      countQuery += ` AND t.status = ?`;
      countParams.push(status);
    }

    if (priority) {
      countQuery += ` AND t.priority = ?`;
      countParams.push(priority);
    }

    if (project_id) {
      countQuery += ` AND t.project_id = ?`;
      countParams.push(parseInt(project_id));
    }

    if (search) {
      countQuery += ` AND (t.title LIKE ? OR t.description LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult[0].count);

    res.json({
      success: true,
      data: {
        tasks: result,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

// Get single task
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      SELECT 
        t.*,
        p.name as project_name,
        p.color as project_color,
        u.name as assigned_to_name,
        creator.name as creator_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users creator ON t.user_id = creator.id
      WHERE t.id = ? AND t.user_id = ?
    `, [id, req.user.userId]);

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      data: {
        task: result[0]
      }
    });

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

    await db.query(`
      INSERT INTO tasks 
      (title, description, status, priority, due_date, project_id, user_id, assigned_to)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      
    `, [
      title,
      description || null,
      status || 'todo',
      priority || 'medium',
      due_date ? new Date(due_date) : null,
      project_id || null,
      req.user.userId,
      assigned_to || null
    ]);

    // Get the newly created task
    const newTask = await db.query(
      'SELECT t.*, p.name as project_name, p.color as project_color, u.name as assigned_to_name FROM tasks t LEFT JOIN projects p ON t.project_id = p.id LEFT JOIN users u ON t.assigned_to = u.id WHERE t.id = LAST_INSERT_ID()',
      []
    );

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: {
        task: newTask[0]
      }
    });

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

    // Check if task exists and belongs to user
    const existingTask = await db.query(
      'SELECT id FROM tasks WHERE id = ? AND user_id = ?',
      [id, req.user.userId]
    );

    if (existingTask.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    await db.query(`
      UPDATE tasks 
      SET title = ?, description = ?, status = ?, priority = ?, 
          due_date = ?, project_id = ?, assigned_to = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `, [
      title,
      description || null,
      status || 'todo',
      priority || 'medium',
      due_date ? new Date(due_date) : null,
      project_id || null,
      assigned_to || null,
      id,
      req.user.userId
    ]);

    // Get the updated task
    const updatedTask = await db.query(
      'SELECT t.*, p.name as project_name, p.color as project_color, u.name as assigned_to_name FROM tasks t LEFT JOIN projects p ON t.project_id = p.id LEFT JOIN users u ON t.assigned_to = u.id WHERE t.id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: {
        task: updatedTask[0]
      }
    });

  } catch (error) {
    next(error);
  }
});

// Delete task
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if task exists and belongs to user
    const existingTask = await db.query(
      'SELECT id FROM tasks WHERE id = ? AND user_id = ?',
      [id, req.user.userId]
    );

    if (existingTask.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    await db.query('DELETE FROM tasks WHERE id = ? AND user_id = ?', [id, req.user.userId]);

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });

  } catch (error) {
    next(error);
  }
});

// Get task statistics
router.get('/stats/overview', authenticateToken, async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'todo' THEN 1 END) as todo_count,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_count,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_count,
        COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority_count,
        COUNT(CASE WHEN due_date < NOW() AND status != 'completed' THEN 1 END) as overdue_count
      FROM tasks 
      WHERE user_id = ?
    `, [req.user.userId]);

    res.json({
      success: true,
      data: {
        stats: result[0]
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;