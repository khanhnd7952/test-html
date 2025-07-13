/**
 * Migration script to convert single script projects to multi-script structure
 * 
 * Old structure:
 * {
 *   id: "uuid",
 *   name: "Project Name", 
 *   scriptId: "GAME_001",
 *   data: { ... ads data ... }
 * }
 * 
 * New structure:
 * {
 *   id: "uuid",
 *   name: "Project Name",
 *   description: "",
 *   scripts: [
 *     {
 *       scriptId: "GAME_001",
 *       name: "Script 1",
 *       data: { ... ads data ... }
 *     }
 *   ]
 * }
 */

const { sequelize } = require('../config/database');
const Project = require('../models/Project');

async function migrateToScripts() {
  console.log('🔄 Starting migration to scripts structure...');
  
  try {
    // Start transaction
    const transaction = await sequelize.transaction();
    
    try {
      // Get all existing projects
      const projects = await Project.findAll({ transaction });
      console.log(`📊 Found ${projects.length} projects to migrate`);
      
      let migratedCount = 0;
      let skippedCount = 0;
      
      for (const project of projects) {
        // Check if already migrated (has scripts field)
        if (project.data && project.data.scripts) {
          console.log(`⏭️  Skipping already migrated project: ${project.name}`);
          skippedCount++;
          continue;
        }
        
        // Create new structure
        const newData = {
          scripts: [
            {
              scriptId: project.scriptId || 'DEFAULT',
              name: project.scriptId ? `Script ${project.scriptId}` : 'Default Script',
              data: project.data || getDefaultAdData()
            }
          ]
        };
        
        // Update project (skip validation during migration)
        await project.update({
          data: newData,
          scriptId: null // Remove old scriptId field
        }, {
          transaction,
          validate: false // Skip validation during migration
        });
        
        console.log(`✅ Migrated project: ${project.name}`);
        migratedCount++;
      }
      
      // Commit transaction
      await transaction.commit();
      
      console.log('🎉 Migration completed successfully!');
      console.log(`📈 Statistics:`);
      console.log(`   - Migrated: ${migratedCount} projects`);
      console.log(`   - Skipped: ${skippedCount} projects`);
      console.log(`   - Total: ${projects.length} projects`);
      
      return { success: true, migrated: migratedCount, skipped: skippedCount };
      
    } catch (error) {
      // Rollback transaction
      await transaction.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

function getDefaultAdData() {
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
}

// Rollback function (if needed)
async function rollbackMigration() {
  console.log('🔄 Starting rollback migration...');
  
  try {
    const transaction = await sequelize.transaction();
    
    try {
      const projects = await Project.findAll({ transaction });
      console.log(`📊 Found ${projects.length} projects to rollback`);
      
      let rolledBackCount = 0;
      
      for (const project of projects) {
        // Check if has scripts structure
        if (project.data && project.data.scripts && project.data.scripts.length > 0) {
          const firstScript = project.data.scripts[0];
          
          // Restore old structure
          await project.update({
            scriptId: firstScript.scriptId,
            data: firstScript.data
          }, { transaction });
          
          console.log(`↩️  Rolled back project: ${project.name}`);
          rolledBackCount++;
        }
      }
      
      await transaction.commit();
      
      console.log('🎉 Rollback completed successfully!');
      console.log(`📈 Rolled back: ${rolledBackCount} projects`);
      
      return { success: true, rolledBack: rolledBackCount };
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw error;
  }
}

module.exports = {
  migrateToScripts,
  rollbackMigration
};
