const request = require('supertest');

// Simple test without database setup for now
describe('API Tests', () => {
  let app;

  beforeAll(async () => {
    // Import app after setting test environment
    process.env.NODE_ENV = 'test';
    process.env.DB_PATH = ':memory:';
    app = require('../server');

    // Wait a bit for server to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    // Cleanup
    if (app && app.close) {
      app.close();
    }
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('version', '2.0.0');
    });
  });

  describe('Projects API', () => {
    const sampleProjectData = {
      name: 'Test Project',
      scriptId: 'TEST_001',
      description: 'Test project description',
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
            bidfloorIds: ['f6g7h8i9j0k1l2m3'],
            loadCount: 3,
            autoReloadInterval: 99999,
            autoRetry: false
          },
          rewarded: {
            defaultId: 'h8i9j0k1l2m3n4o5',
            bidfloorIds: ['i9j0k1l2m3n4o5p6'],
            loadCount: 3,
            autoReloadInterval: 99999,
            autoRetry: false
          },
          banner: {
            bidfloorBanner: 'k1l2m3n4o5p6q7r8'
          }
        }
      }
    };

    describe('POST /api/projects', () => {
      it('should create a new project', async () => {
        const response = await request(app)
          .post('/api/projects')
          .send(sampleProjectData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data.name).toBe(sampleProjectData.name);
        expect(response.body.data.scriptId).toBe(sampleProjectData.scriptId);
      });

      it('should reject project with invalid Ad ID', async () => {
        const invalidData = {
          ...sampleProjectData,
          data: {
            ...sampleProjectData.data,
            defaultAdUnitData: {
              ...sampleProjectData.data.defaultAdUnitData,
              interstitialId: 'invalid-id'
            }
          }
        };

        await request(app)
          .post('/api/projects')
          .send(invalidData)
          .expect(400);
      });

      it('should reject project with duplicate name', async () => {
        // Create first project
        await request(app)
          .post('/api/projects')
          .send(sampleProjectData)
          .expect(201);

        // Try to create duplicate
        await request(app)
          .post('/api/projects')
          .send(sampleProjectData)
          .expect(409);
      });
    });

    describe('GET /api/projects', () => {
      beforeEach(async () => {
        // Create test projects
        await Project.create(sampleProjectData);
        await Project.create({
          ...sampleProjectData,
          name: 'Test Project 2',
          scriptId: 'TEST_002'
        });
      });

      it('should get all projects', async () => {
        const response = await request(app)
          .get('/api/projects')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.projects).toHaveLength(2);
        expect(response.body.data.pagination).toHaveProperty('totalItems', 2);
      });

      it('should search projects', async () => {
        const response = await request(app)
          .get('/api/projects?search=Test Project 2')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.projects).toHaveLength(1);
        expect(response.body.data.projects[0].name).toBe('Test Project 2');
      });
    });

    describe('GET /api/projects/:id', () => {
      let projectId;

      beforeEach(async () => {
        const project = await Project.create(sampleProjectData);
        projectId = project.id;
      });

      it('should get project by ID', async () => {
        const response = await request(app)
          .get(`/api/projects/${projectId}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(projectId);
        expect(response.body.data.name).toBe(sampleProjectData.name);
      });

      it('should return 404 for non-existent project', async () => {
        const fakeId = '123e4567-e89b-12d3-a456-426614174000';
        await request(app)
          .get(`/api/projects/${fakeId}`)
          .expect(404);
      });
    });

    describe('PUT /api/projects/:id', () => {
      let projectId;

      beforeEach(async () => {
        const project = await Project.create(sampleProjectData);
        projectId = project.id;
      });

      it('should update project', async () => {
        const updateData = {
          name: 'Updated Project Name',
          scriptId: 'UPDATED_001'
        };

        const response = await request(app)
          .put(`/api/projects/${projectId}`)
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe(updateData.name);
        expect(response.body.data.scriptId).toBe(updateData.scriptId);
      });
    });

    describe('DELETE /api/projects/:id', () => {
      let projectId;

      beforeEach(async () => {
        const project = await Project.create(sampleProjectData);
        projectId = project.id;
      });

      it('should delete project', async () => {
        const response = await request(app)
          .delete(`/api/projects/${projectId}`)
          .expect(200);

        expect(response.body.success).toBe(true);

        // Verify project is deleted
        const project = await Project.findByPk(projectId);
        expect(project).toBeNull();
      });
    });

    describe('POST /api/projects/:id/duplicate', () => {
      let projectId;

      beforeEach(async () => {
        const project = await Project.create(sampleProjectData);
        projectId = project.id;
      });

      it('should duplicate project', async () => {
        const response = await request(app)
          .post(`/api/projects/${projectId}/duplicate`)
          .send({ name: 'Duplicated Project' })
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe('Duplicated Project');
        expect(response.body.data.id).not.toBe(projectId);

        // Verify both projects exist
        const projects = await Project.findAll();
        expect(projects).toHaveLength(2);
      });
    });
  });
});
