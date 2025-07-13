const Project = require('../models/Project');
const Joi = require('joi');

// Validation schemas
const createProjectSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  description: Joi.string().trim().max(500).allow('').optional(),
  data: Joi.object().required()
});

const updateProjectSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).optional(),
  description: Joi.string().trim().max(500).allow('').optional(),
  data: Joi.object().optional()
});

// Get all projects (simplified - no pagination, search)
const getAllProjects = async (req, res) => {
  try {
    const projects = await Project.findAll({
      order: [['updatedAt', 'DESC']],
      attributes: ['id', 'name', 'description', 'createdAt', 'updatedAt']
    });

    res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch projects',
      error: error.message
    });
  }
};

// Get unique script IDs from all projects
const getScriptIds = async (req, res) => {
  try {
    const projects = await Project.findAll({
      attributes: ['data']
    });

    const scriptIds = new Set();

    projects.forEach(project => {
      if (project.data && project.data.scripts && Array.isArray(project.data.scripts)) {
        project.data.scripts.forEach(script => {
          if (script.scriptId) {
            scriptIds.add(script.scriptId);
          }
        });
      }
    });

    const uniqueScriptIds = Array.from(scriptIds).sort();

    res.json({
      success: true,
      data: uniqueScriptIds
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch script IDs',
      error: error.message
    });
  }
};

// Get project by ID
const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const project = await Project.findByPk(id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project',
      error: error.message
    });
  }
};

// Get project by name
const getProjectByName = async (req, res) => {
  try {
    const { name } = req.params;
    
    const project = await Project.findOne({
      where: { name: decodeURIComponent(name) }
    });
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project',
      error: error.message
    });
  }
};

// Create new project
const createProject = async (req, res) => {
  try {
    const { error, value } = createProjectSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }
    
    const project = await Project.create(value);
    
    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'Project name already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create project',
      error: error.message
    });
  }
};

// Update project
const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updateProjectSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }
    
    const project = await Project.findByPk(id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    await project.update(value);
    
    res.json({
      success: true,
      message: 'Project updated successfully',
      data: project
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'Project name already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update project',
      error: error.message
    });
  }
};

// Delete project
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    
    const project = await Project.findByPk(id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    await project.destroy();
    
    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete project',
      error: error.message
    });
  }
};

// Get scripts from a project
const getProjectScripts = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const scripts = project.data && project.data.scripts ? project.data.scripts : [];

    res.json({
      success: true,
      data: {
        projectId: project.id,
        projectName: project.name,
        scripts: scripts
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project scripts',
      error: error.message
    });
  }
};

// Get specific script from project
const getProjectScript = async (req, res) => {
  try {
    const { id, scriptId } = req.params;

    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const script = project.getScript(scriptId);
    if (!script) {
      return res.status(404).json({
        success: false,
        message: 'Script not found'
      });
    }

    res.json({
      success: true,
      data: script
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch script',
      error: error.message
    });
  }
};

// Add script to project
const addProjectScript = async (req, res) => {
  try {
    const { id } = req.params;
    const { scriptId, name, data } = req.body;

    if (!scriptId || !name) {
      return res.status(400).json({
        success: false,
        message: 'Script ID and name are required'
      });
    }

    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Add script using model method
    project.addScript(scriptId, name, data);
    await project.save();

    res.status(201).json({
      success: true,
      message: 'Script added successfully',
      data: project.getScript(scriptId)
    });
  } catch (error) {
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to add script',
      error: error.message
    });
  }
};

// Update script in project
const updateProjectScript = async (req, res) => {
  try {
    const { id, scriptId } = req.params;
    const updates = req.body;

    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const success = project.updateScript(scriptId, updates);
    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Script not found'
      });
    }

    await project.save();

    res.json({
      success: true,
      message: 'Script updated successfully',
      data: project.getScript(scriptId)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update script',
      error: error.message
    });
  }
};

// Delete script from project
const deleteProjectScript = async (req, res) => {
  try {
    const { id, scriptId } = req.params;

    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const success = project.removeScript(scriptId);
    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Script not found'
      });
    }

    await project.save();

    res.json({
      success: true,
      message: 'Script deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete script',
      error: error.message
    });
  }
};

module.exports = {
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
};
