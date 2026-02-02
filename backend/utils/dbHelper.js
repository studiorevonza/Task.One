const mongoose = require('mongoose');

// In-memory storage for when database is not available
const inMemoryStorage = {
  users: new Map(),
  projects: new Map(),
  tasks: new Map()
};

// Variable to track if we've had a successful connection
let isConnected = false;

// Function to check if database is connected
const isDbConnected = () => {
  return mongoose.connection.readyState === 1 && isConnected; // 1 means connected
};

// Function to set the connection status
const setDbConnected = (status) => {
  isConnected = status;
};

// Function to wrap database operations with error handling
const dbOperation = async (operationFn, fallbackValue = null) => {
  try {
    if (!isDbConnected()) {
      console.warn('⚠️ Database not connected, using in-memory storage');
      return fallbackValue;
    }
    return await operationFn();
  } catch (error) {
    console.error('Database operation failed:', error.message);
    return fallbackValue;
  }
};

// In-memory operations for fallback
const inMemoryOperations = {
  // User operations
  findUserByEmail: (email) => {
    for (let [id, user] of inMemoryStorage.users) {
      if (user.email === email) {
        return { ...user, id };
      }
    }
    return null;
  },
  
  findUserById: (id) => {
    const user = inMemoryStorage.users.get(id);
    return user ? { ...user, id } : null;
  },
  
  createUser: (userData) => {
    const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const user = {
      ...userData,
      _id: id,
      id: id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    inMemoryStorage.users.set(id, user);
    return user;
  },
  
  updateUser: (id, updateData) => {
    const user = inMemoryStorage.users.get(id);
    if (user) {
      const updatedUser = { ...user, ...updateData, updated_at: new Date().toISOString() };
      inMemoryStorage.users.set(id, updatedUser);
      return updatedUser;
    }
    return null;
  },
  
  // Project operations
  findProjectsByUserId: (userId) => {
    const projects = [];
    for (let [id, project] of inMemoryStorage.projects) {
      if (project.user === userId) {
        projects.push({ ...project, id });
      }
    }
    return projects;
  },
  
  findProjectById: (id) => {
    const project = inMemoryStorage.projects.get(id);
    return project ? { ...project, id } : null;
  },
  
  createProject: (projectData) => {
    const id = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const project = {
      ...projectData,
      _id: id,
      id: id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    inMemoryStorage.projects.set(id, project);
    return project;
  },
  
  // Task operations
  findTasksByUserId: (userId) => {
    const tasks = [];
    for (let [id, task] of inMemoryStorage.tasks) {
      if (task.user === userId) {
        tasks.push({ ...task, id });
      }
    }
    return tasks;
  },
  
  findTaskById: (id) => {
    const task = inMemoryStorage.tasks.get(id);
    return task ? { ...task, id } : null;
  },
  
  createTask: (taskData) => {
    const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const task = {
      ...taskData,
      _id: id,
      id: id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    inMemoryStorage.tasks.set(id, task);
    return task;
  }
};

module.exports = {
  isDbConnected,
  dbOperation,
  setDbConnected,
  inMemoryOperations
};