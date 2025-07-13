const { sequelize } = require('./database');
const Project = require('../models/Project');

async function initDatabase() {
  try {
    console.log('🔄 Initializing database...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Sync models
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ Database models synchronized successfully.');
    
    // Create sample data if database is empty
    const projectCount = await Project.count();
    if (projectCount === 0) {
      console.log('📝 Creating sample project...');
      
      const sampleProject = await Project.create({
        name: 'Sample Project',
        scriptId: 'SAMPLE_001',
        description: 'This is a sample project to demonstrate the AdData tool functionality',
        data: {
          defaultAdUnitData: {
            interstitialId: 'a1b2c3d4e5f6g7h8',
            rewardedVideoId: 'b2c3d4e5f6g7h8i9',
            bannerId: 'c3d4e5f6g7h8i9j0',
            aoaId: 'd4e5f6g7h8i9j0k1'
          },
          bidfloorConfig: {
            interstitial: {
              defaultId: 'e5f6g7h8i9j0k1l2',
              bidfloorIds: ['f6g7h8i9j0k1l2m3', 'g7h8i9j0k1l2m3n4'],
              loadCount: 3,
              autoReloadInterval: 99999,
              autoRetry: false
            },
            rewarded: {
              defaultId: 'h8i9j0k1l2m3n4o5',
              bidfloorIds: ['i9j0k1l2m3n4o5p6', 'j0k1l2m3n4o5p6q7'],
              loadCount: 3,
              autoReloadInterval: 99999,
              autoRetry: false
            },
            banner: {
              bidfloorBanner: 'k1l2m3n4o5p6q7r8'
            }
          }
        },
        tags: ['sample', 'demo', 'test']
      });
      
      console.log(`✅ Sample project created with ID: ${sampleProject.id}`);
    }
    
    console.log('🎉 Database initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  initDatabase()
    .then(() => {
      console.log('✅ Database initialization script completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database initialization script failed:', error);
      process.exit(1);
    });
}

module.exports = { initDatabase };
