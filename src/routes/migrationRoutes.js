const express = require('express');
const router = express.Router();
const { migrateToScripts, rollbackMigration } = require('../migrations/migrate-to-scripts');
const { simpleMigration } = require('../migrations/simple-migrate');

/**
 * POST /api/migration/to-scripts
 * Migrate existing projects to new scripts structure
 */
router.post('/to-scripts', async (req, res) => {
  try {
    const result = await migrateToScripts();

    res.json({
      success: true,
      message: 'Migration completed successfully',
      data: result
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: error.message
    });
  }
});

/**
 * POST /api/migration/simple
 * Simple migration using raw SQL
 */
router.post('/simple', async (req, res) => {
  try {
    const result = await simpleMigration();

    res.json({
      success: true,
      message: 'Simple migration completed successfully',
      data: result
    });
  } catch (error) {
    console.error('Simple migration error:', error);
    res.status(500).json({
      success: false,
      message: 'Simple migration failed',
      error: error.message
    });
  }
});

/**
 * POST /api/migration/rollback-scripts
 * Rollback scripts migration (restore old structure)
 */
router.post('/rollback-scripts', async (req, res) => {
  try {
    const result = await rollbackMigration();
    
    res.json({
      success: true,
      message: 'Rollback completed successfully',
      data: result
    });
  } catch (error) {
    console.error('Rollback error:', error);
    res.status(500).json({
      success: false,
      message: 'Rollback failed',
      error: error.message
    });
  }
});

/**
 * GET /api/migration/status
 * Check migration status
 */
router.get('/status', async (req, res) => {
  try {
    const Project = require('../models/Project');
    
    // Get sample projects to check structure
    const projects = await Project.findAll({ limit: 5 });
    
    let oldStructureCount = 0;
    let newStructureCount = 0;
    
    projects.forEach(project => {
      if (project.data && project.data.scripts) {
        newStructureCount++;
      } else {
        oldStructureCount++;
      }
    });
    
    const isFullyMigrated = oldStructureCount === 0 && projects.length > 0;
    const needsMigration = oldStructureCount > 0;
    
    res.json({
      success: true,
      data: {
        totalProjects: projects.length,
        oldStructureCount,
        newStructureCount,
        isFullyMigrated,
        needsMigration,
        migrationAvailable: true
      }
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check migration status',
      error: error.message
    });
  }
});

module.exports = router;
