const Joi = require('joi');

// Ad ID validation pattern
const AD_ID_PATTERN = /^[a-z0-9]{16}$/;

// Custom Joi validation for Ad IDs
const adIdValidator = Joi.string().pattern(AD_ID_PATTERN).message('Ad ID must be exactly 16 characters (lowercase letters and numbers only)');

// AdData structure validation schema
const adDataSchema = Joi.object({
  defaultAdUnitData: Joi.object({
    interstitialId: adIdValidator.allow(''),
    rewardedVideoId: adIdValidator.allow(''),
    bannerId: adIdValidator.allow(''),
    aoaId: adIdValidator.allow('')
  }).required(),
  
  bidfloorConfig: Joi.object({
    interstitial: Joi.object({
      defaultId: adIdValidator.allow(''),
      bidfloorIds: Joi.array().items(adIdValidator),
      loadCount: Joi.number().integer().min(1).default(3),
      autoReloadInterval: Joi.number().integer().min(1).default(99999),
      autoRetry: Joi.boolean().default(false)
    }),
    
    rewarded: Joi.object({
      defaultId: adIdValidator.allow(''),
      bidfloorIds: Joi.array().items(adIdValidator),
      loadCount: Joi.number().integer().min(1).default(3),
      autoReloadInterval: Joi.number().integer().min(1).default(99999),
      autoRetry: Joi.boolean().default(false)
    }),
    
    banner: Joi.object({
      bidfloorBanner: adIdValidator.allow('')
    })
  }).required()
});

// Project validation schemas
const projectSchemas = {
  create: Joi.object({
    name: Joi.string().trim().min(1).max(100).required(),
    scriptId: Joi.string().trim().max(50).allow('').optional(),
    description: Joi.string().trim().max(500).allow('').optional(),
    data: adDataSchema.required(),
    tags: Joi.array().items(Joi.string().trim()).optional(),
    version: Joi.string().pattern(/^\d+\.\d+\.\d+$/).default('1.0.0')
  }),
  
  update: Joi.object({
    name: Joi.string().trim().min(1).max(100).optional(),
    scriptId: Joi.string().trim().max(50).allow('').optional(),
    description: Joi.string().trim().max(500).allow('').optional(),
    data: adDataSchema.optional(),
    tags: Joi.array().items(Joi.string().trim()).optional(),
    version: Joi.string().pattern(/^\d+\.\d+\.\d+$/).optional()
  })
};

// Utility functions
const validateAdId = (id) => {
  if (!id || typeof id !== 'string') return false;
  return AD_ID_PATTERN.test(id.trim());
};

const validateAdData = (data) => {
  const { error, value } = adDataSchema.validate(data, { allowUnknown: true });
  return { isValid: !error, error, value };
};

const sanitizeProjectData = (data) => {
  // Remove any potentially dangerous properties
  const sanitized = { ...data };
  delete sanitized.__proto__;
  delete sanitized.constructor;
  
  // Ensure required structure exists
  if (!sanitized.defaultAdUnitData) {
    sanitized.defaultAdUnitData = {};
  }
  
  if (!sanitized.bidfloorConfig) {
    sanitized.bidfloorConfig = {};
  }
  
  return sanitized;
};

const generateDefaultAdData = () => {
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

module.exports = {
  adDataSchema,
  projectSchemas,
  validateAdId,
  validateAdData,
  sanitizeProjectData,
  generateDefaultAdData,
  AD_ID_PATTERN
};
