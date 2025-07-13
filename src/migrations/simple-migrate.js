/**
 * Simple migration script using raw SQL to avoid validation issues
 */

const { sequelize } = require('../config/database');

async function simpleMigration() {
  console.log('🔄 Starting simple migration to scripts structure...');
  
  try {
    // Get all projects with old structure
    const [projects] = await sequelize.query(`
      SELECT id, name, data 
      FROM projects 
      WHERE json_extract(data, '$.scripts') IS NULL
    `);
    
    console.log(`📊 Found ${projects.length} projects to migrate`);
    
    if (projects.length === 0) {
      console.log('✅ No projects need migration');
      return { success: true, migrated: 0, skipped: 0 };
    }
    
    let migratedCount = 0;
    
    // Start transaction
    const transaction = await sequelize.transaction();
    
    try {
      for (const project of projects) {
        const oldData = JSON.parse(project.data);
        
        // Create new structure
        const newData = {
          scripts: [
            {
              scriptId: 'DEFAULT',
              name: 'Default Script',
              data: oldData
            }
          ]
        };
        
        // Update using raw SQL to bypass validation
        await sequelize.query(`
          UPDATE projects 
          SET data = :newData 
          WHERE id = :id
        `, {
          replacements: {
            newData: JSON.stringify(newData),
            id: project.id
          },
          transaction
        });
        
        console.log(`✅ Migrated project: ${project.name}`);
        migratedCount++;
      }
      
      // Commit transaction
      await transaction.commit();
      
      console.log('🎉 Migration completed successfully!');
      console.log(`📈 Statistics: Migrated ${migratedCount} projects`);
      
      return { success: true, migrated: migratedCount, skipped: 0 };
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

module.exports = {
  simpleMigration
};
