const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: {
        msg: 'Project name cannot be empty'
      },
      len: {
        args: [1, 100],
        msg: 'Project name must be between 1 and 100 characters'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: {
        args: [0, 500],
        msg: 'Description must be less than 500 characters'
      }
    },
    comment: 'Optional project description'
  },
  data: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: { scripts: [] },
    validate: {
      isValidProjectData(value) {
        if (typeof value !== 'object' || value === null) {
          throw new Error('Data must be a valid JSON object');
        }

        // New structure validation - must have scripts array
        if (!value.scripts || !Array.isArray(value.scripts)) {
          throw new Error('Data must contain a scripts array');
        }

        // Validate each script
        value.scripts.forEach((script, index) => {
          if (!script.scriptId || typeof script.scriptId !== 'string') {
            throw new Error(`Script ${index}: scriptId is required and must be a string`);
          }

          if (!script.name || typeof script.name !== 'string') {
            throw new Error(`Script ${index}: name is required and must be a string`);
          }

          if (!script.data || typeof script.data !== 'object') {
            throw new Error(`Script ${index}: data is required and must be an object`);
          }

          // Validate script data structure
          validateScriptData(script.data, `Script ${index}`);
        });

        // Helper function for validating script data
        function validateScriptData(scriptData, prefix = '') {
          // Validate basic structure
          const requiredFields = ['defaultAdUnitData', 'bidfloorConfig'];
          for (const field of requiredFields) {
            if (!(field in scriptData)) {
              throw new Error(`${prefix}: Missing required field: ${field}`);
            }
          }

          // Validate Ad IDs format if present
          const adIdPattern = /^[a-z0-9]{16}$/;
          const validateAdId = (id, fieldName) => {
            if (id && !adIdPattern.test(id)) {
              throw new Error(`${prefix}: Invalid Ad ID format for ${fieldName}: must be 16 characters (a-z, 0-9)`);
            }
          };

          // Validate DefaultAdUnitData IDs
          const defaultData = scriptData.defaultAdUnitData || {};
          validateAdId(defaultData.interstitialId, 'interstitialId');
          validateAdId(defaultData.rewardedVideoId, 'rewardedVideoId');
          validateAdId(defaultData.bannerId, 'bannerId');
          validateAdId(defaultData.aoaId, 'aoaId');

          // Validate BidfloorConfig IDs
          const bidfloorConfig = scriptData.bidfloorConfig || {};

          // Interstitial
          if (bidfloorConfig.interstitial) {
            validateAdId(bidfloorConfig.interstitial.defaultId, 'interstitial.defaultId');
            if (bidfloorConfig.interstitial.bidfloorIds) {
              bidfloorConfig.interstitial.bidfloorIds.forEach((id, index) => {
                validateAdId(id, `interstitial.bidfloorIds[${index}]`);
              });
            }
          }

          // Rewarded
          if (bidfloorConfig.rewarded) {
            validateAdId(bidfloorConfig.rewarded.defaultId, 'rewarded.defaultId');
            if (bidfloorConfig.rewarded.bidfloorIds) {
              bidfloorConfig.rewarded.bidfloorIds.forEach((id, index) => {
                validateAdId(id, `rewarded.bidfloorIds[${index}]`);
              });
            }
          }

          // Banner
          if (bidfloorConfig.banner) {
            validateAdId(bidfloorConfig.banner.bidfloorBanner, 'banner.bidfloorBanner');
          }
        }
      }
    }
  },

}, {
  tableName: 'projects',
  hooks: {
    beforeValidate: (project) => {
      // Trim whitespace from string fields
      if (project.name) {
        project.name = project.name.trim();
      }
      if (project.description) {
        project.description = project.description.trim();
      }
    },
    beforeCreate: (project) => {
      // Set default data structure if empty or invalid
      if (!project.data || !project.data.scripts || !Array.isArray(project.data.scripts)) {
        project.data = {
          scripts: [
            {
              scriptId: 'DEFAULT',
              name: 'Default Script',
              data: Project.getDefaultScriptData()
            }
          ]
        };
      }
    }
  }
});

// Static methods
Project.getDefaultScriptData = function() {
  return {
    defaultAdUnitData: {
      interstitialId: '',
      rewardedVideoId: '',
      bannerId: '',
      aoaId: ''
    },
    bidfloorConfig: {
      interstitial: {
        defaultId: '',
        bidfloorIds: [],
        loadCount: 3,
        autoReloadInterval: 99999,
        autoRetry: false
      },
      rewarded: {
        defaultId: '',
        bidfloorIds: [],
        loadCount: 3,
        autoReloadInterval: 99999,
        autoRetry: false
      },
      banner: {
        bidfloorBanner: ''
      }
    }
  };
};

// Instance methods
Project.prototype.toSafeJSON = function() {
  const { id, name, description, createdAt, updatedAt } = this;
  return {
    id,
    name,
    description,
    createdAt,
    updatedAt,
    scriptCount: this.data && this.data.scripts ? this.data.scripts.length : 0,
    hasData: this.data && this.data.scripts && this.data.scripts.length > 0
  };
};

Project.prototype.getScriptIds = function() {
  if (!this.data || !this.data.scripts) return [];
  return this.data.scripts.map(script => script.scriptId);
};

Project.prototype.getScript = function(scriptId) {
  if (!this.data || !this.data.scripts) return null;
  return this.data.scripts.find(script => script.scriptId === scriptId);
};

Project.prototype.addScript = function(scriptId, name, data = null) {
  if (!this.data) this.data = { scripts: [] };
  if (!this.data.scripts) this.data.scripts = [];

  // Check if script already exists
  if (this.data.scripts.find(script => script.scriptId === scriptId)) {
    throw new Error(`Script with ID '${scriptId}' already exists`);
  }

  this.data.scripts.push({
    scriptId,
    name,
    data: data || Project.getDefaultScriptData()
  });
};

Project.prototype.updateScript = function(scriptId, updates) {
  if (!this.data || !this.data.scripts) return false;

  const scriptIndex = this.data.scripts.findIndex(script => script.scriptId === scriptId);
  if (scriptIndex === -1) return false;

  this.data.scripts[scriptIndex] = { ...this.data.scripts[scriptIndex], ...updates };
  return true;
};

Project.prototype.removeScript = function(scriptId) {
  if (!this.data || !this.data.scripts) return false;

  const scriptIndex = this.data.scripts.findIndex(script => script.scriptId === scriptId);
  if (scriptIndex === -1) return false;

  this.data.scripts.splice(scriptIndex, 1);
  return true;
};

module.exports = Project;
