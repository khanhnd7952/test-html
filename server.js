const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { sequelize } = require('./src/config/database');
const projectRoutes = require('./src/routes/projectRoutes');
const migrationRoutes = require('./src/routes/migrationRoutes');
const { errorHandler, notFound } = require('./src/middleware/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      mediaSrc: ["'self'", "data:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Middleware
app.use(compression());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use(express.static(path.join(__dirname, 'frontend/public')));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'frontend/views'));

// Routes
app.get('/', (req, res) => {
  res.render('index', { 
    title: 'AdData JSON Serializer Tool',
    version: '2.0.0'
  });
});

// API Routes
app.use('/api/projects', projectRoutes);
app.use('/api/migration', migrationRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Database viewer (for development)
app.get('/db-viewer', async (req, res) => {
  try {
    const Project = require('./src/models/Project');
    const projects = await Project.findAll({
      order: [['updatedAt', 'DESC']]
    });

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Database Viewer - AdData Tool</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { border-collapse: collapse; width: 100%; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #f2f2f2; }
          .json-data { max-width: 300px; overflow: auto; font-family: monospace; font-size: 12px; }
          .header { background: #007bff; color: white; padding: 15px; border-radius: 5px; }
          .stats { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🗄️ Database Viewer - AdData Tool</h1>
          <p>Xem dữ liệu trong database SQLite</p>
        </div>

        <div class="stats">
          <h3>📊 Thống kê Database:</h3>
          <p><strong>Tổng số projects:</strong> ${projects.length}</p>
          <p><strong>Database file:</strong> ${process.env.DB_PATH || './database/addata.sqlite'}</p>
          <p><strong>Thời gian kiểm tra:</strong> ${new Date().toLocaleString('vi-VN')}</p>
        </div>

        <h3>📋 Danh sách Projects:</h3>
        ${projects.length === 0 ? '<p>Không có project nào trong database.</p>' : `
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên Project</th>
              <th>Scripts</th>
              <th>Ngày tạo</th>
              <th>Cập nhật</th>
              <th>Dữ liệu AdData</th>
            </tr>
          </thead>
          <tbody>
            ${projects.map(project => {
              const scripts = project.data && project.data.scripts ? project.data.scripts : [];
              const scriptsList = scripts.length > 0
                ? scripts.map(s => `<span style="background: #e9ecef; padding: 2px 6px; border-radius: 3px; margin: 2px; display: inline-block; font-family: monospace; font-size: 11px;">${s.scriptId}: ${s.name}</span>`).join(' ')
                : '<em>Không có scripts</em>';

              return `
              <tr>
                <td style="font-family: monospace; font-size: 11px;">${project.id}</td>
                <td><strong>${project.name}</strong></td>
                <td style="max-width: 200px;">${scriptsList}</td>
                <td>${new Date(project.createdAt).toLocaleString('vi-VN')}</td>
                <td>${new Date(project.updatedAt).toLocaleString('vi-VN')}</td>
                <td class="json-data">
                  <details>
                    <summary>Xem JSON (${JSON.stringify(project.data).length} chars) - ${scripts.length} scripts</summary>
                    <pre>${JSON.stringify(project.data, null, 2)}</pre>
                  </details>
                </td>
              </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        `}

        <div style="margin-top: 30px; padding: 15px; background: #e9ecef; border-radius: 5px;">
          <h4>🔧 Các cách khác để kiểm tra database:</h4>
          <ul>
            <li><strong>API:</strong> <a href="/api/projects" target="_blank">GET /api/projects</a></li>
            <li><strong>SQLite Browser:</strong> Mở file <code>${process.env.DB_PATH || './database/addata.sqlite'}</code></li>
            <li><strong>Command line:</strong> <code>sqlite3 ${process.env.DB_PATH || './database/addata.sqlite'}</code></li>
          </ul>
        </div>

        <div style="margin-top: 20px; text-align: center;">
          <a href="/" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">← Quay lại AdData Tool</a>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send(`
      <h1>❌ Lỗi khi đọc database</h1>
      <p>${error.message}</p>
      <a href="/">← Quay lại</a>
    `);
  }
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Database connection and server start
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized successfully.');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`🌐 Open http://localhost:${PORT} in your browser`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🔄 SIGTERM received, shutting down gracefully...');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🔄 SIGINT received, shutting down gracefully...');
  await sequelize.close();
  process.exit(0);
});

startServer();

module.exports = app;
