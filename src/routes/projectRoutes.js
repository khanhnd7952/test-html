const express = require('express');
const router = express.Router();
const {
  getAllProjects,
  getProjectById,
  getProjectByName,
  getScriptIds,
  getProjectScripts,
  getProjectScript,
  addProjectScript,
  updateProjectScript,
  deleteProjectScript,
  createProject,
  updateProject,
  deleteProject
} = require('../controllers/projectController');

// Validation middleware
const validateUUID = (req, res, next) => {
  const { id } = req.params;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid project ID format'
    });
  }
  
  next();
};

// Routes
router.get('/', getAllProjects);
router.get('/script-ids', getScriptIds);
router.get('/by-name/:name', getProjectByName);
router.get('/:id', validateUUID, getProjectById);

// Script management routes
router.get('/:id/scripts', validateUUID, getProjectScripts);
router.get('/:id/scripts/:scriptId', validateUUID, getProjectScript);
router.post('/:id/scripts', validateUUID, addProjectScript);
router.put('/:id/scripts/:scriptId', validateUUID, updateProjectScript);
router.delete('/:id/scripts/:scriptId', validateUUID, deleteProjectScript);

// Project CRUD
router.post('/', createProject);
router.put('/:id', validateUUID, updateProject);
router.delete('/:id', validateUUID, deleteProject);

module.exports = router;
