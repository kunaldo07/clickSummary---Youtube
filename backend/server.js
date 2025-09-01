require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3001;

// Environment validation - only require JWT_SECRET for development
const criticalEnvVars = ['JWT_SECRET'];
const optionalEnvVars = ['MONGODB_URI', 'OPENAI_API_KEY', 'RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET'];

const missingCritical = criticalEnvVars.filter(varName => !process.env[varName]);
const missingOptional = optionalEnvVars.filter(varName => !process.env[varName]);

if (missingCritical.length > 0) {
  console.error('❌ Missing critical environment variables:');
  missingCritical.forEach(varName => console.error(`   - ${varName}`));
  console.error('\n💡 Copy backend/config.template to backend/.env and fill in the values');
  process.exit(1);
}

if (missingOptional.length > 0) {
  console.log('⚠️  Missing optional environment variables (development mode):');
  missingOptional.forEach(varName => console.log(`   - ${varName}`));
  console.log('💡 Some features may use fallback/mock implementations\n');
}

// Configure trust proxy securely based on environment
if (process.env.NODE_ENV === 'production') {
  // In production, only trust specific proxies (configure as needed)
  // For example, trust only the first proxy (typical load balancer setup)
  app.set('trust proxy', 1);
  console.log('🔒 Trust proxy: Production mode (first proxy only)');
} else {
  // In development, we don't need trust proxy for localhost
  // This prevents the rate limiting security warning
  app.set('trust proxy', false);
  console.log('🔒 Trust proxy: Development mode (disabled for security)');
}

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.openai.com"],
    },
  },
}));

app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:3000',
    'http://localhost:3002',  // Add support for React app on port 3002
    `chrome-extension://${process.env.EXTENSION_ID}`
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Extension-ID', 'X-Extension-Version']
}));

app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Database connection - graceful fallback for development
let mongodbConnected = false;
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    mongodbConnected = true;
    console.log('✅ Connected to MongoDB');
    console.log(`📊 Database: ${mongoose.connection.name}`);
  })
  .catch(err => {
    console.log('⚠️  MongoDB connection failed - using in-memory storage for development');
    console.log('💡 Install MongoDB or use MongoDB Atlas for production');
    mongodbConnected = false;
  });
} else {
  console.log('⚠️  MongoDB URI not configured - using in-memory storage');
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/summarizer', require('./routes/summarizer'));
app.use('/api/analytics', require('./routes/analytics'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    caching: process.env.ENABLE_SMART_CACHING === 'true' ? 'enabled' : 'disabled',
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({ 
    error: isDevelopment ? err.message : 'Internal server error',
    ...(isDevelopment && { stack: err.stack })
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🔄 Received SIGTERM, shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🔄 Received SIGINT, shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log('🚀 YouTube Summarizer Backend Server');
  console.log('=====================================');
  console.log(`🌐 Server running on port ${PORT}`);
  console.log(`🤖 AI Model: ${process.env.OPENAI_MODEL || 'gpt-4o-mini'}`);
  console.log(`💰 Cost limit: $${process.env.MAX_MONTHLY_COST_PER_USER || '2.50'}/user/month`);
  console.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Caching: ${process.env.ENABLE_SMART_CACHING === 'true' ? 'enabled' : 'disabled'}`);
  console.log('=====================================');
});