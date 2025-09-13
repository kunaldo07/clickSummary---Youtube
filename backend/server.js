require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3001;

// Environment detection
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = !isProduction;

console.log(`🌍 Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);

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

if (missingOptional.length > 0 && isDevelopment) {
  console.log('⚠️  Missing optional environment variables (development mode):');
  missingOptional.forEach(varName => console.log(`   - ${varName}`));
  console.log('💡 Some features may use fallback/mock implementations\n');
}

// Configure trust proxy securely based on environment
if (isProduction) {
  app.set('trust proxy', 1);
  console.log('🔒 Trust proxy: Production mode (first proxy only)');
} else {
  app.set('trust proxy', false);
  console.log('🔒 Trust proxy: Development mode (disabled for security)');
}

// Environment-based CORS configuration
const getAllowedOrigins = () => {
  const origins = [];
  
  if (isDevelopment) {
    // Development origins
    origins.push(
      'http://localhost:3000',
      'http://localhost:3002',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3002'
    );
    
    // ALSO allow production origins during development for testing
    origins.push(
      'https://www.clicksummary.com',
      'https://clicksummary.com'
    );
  }
  
  if (isProduction) {
    // Production origins
    origins.push(
      'https://www.clicksummary.com',
      'https://clicksummary.com'
    );
  }
  
  // Add custom CLIENT_URL if provided
  if (process.env.CLIENT_URL) {
    origins.push(process.env.CLIENT_URL);
  }
  
  // Add Chrome extension origin if provided
  if (process.env.EXTENSION_ID) {
    origins.push(`chrome-extension://${process.env.EXTENSION_ID}`);
  }
  
  return origins.filter(Boolean);
};

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

const allowedOrigins = getAllowedOrigins();
console.log('🌐 Allowed CORS origins:', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // In development, be more permissive with Chrome extensions
    if (isDevelopment) {
      // Allow any chrome-extension:// origin in development
      if (origin && origin.startsWith('chrome-extension://')) {
        console.log(`✅ Allowing Chrome extension origin in development: ${origin}`);
        return callback(null, true);
      }
      
      // Allow localhost on any port in development
      if (origin && origin.match(/^https?:\/\/(localhost|127\.0\.0\.1):/)) {
        console.log(`✅ Allowing localhost origin in development: ${origin}`);
        return callback(null, true);
      }
    }
    
    // In production, still allow Chrome extensions if they match extension ID
    if (isProduction && origin && origin.startsWith('chrome-extension://') && process.env.EXTENSION_ID) {
      const extensionOrigin = `chrome-extension://${process.env.EXTENSION_ID}`;
      if (origin === extensionOrigin) {
        console.log(`✅ Allowing production Chrome extension: ${origin}`);
        return callback(null, true);
      }
    }
    
    // Log rejected origins for debugging
    console.warn(`⚠️ CORS rejected origin: ${origin}`);
    console.warn(`📋 Allowed origins:`, allowedOrigins);
    callback(new Error('Not allowed by CORS'));
  },
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
    environment: process.env.NODE_ENV || 'development',
    model: process.env.OPENAI_MODEL || 'gpt-5-nano',
    caching: process.env.ENABLE_SMART_CACHING === 'true' ? 'enabled' : 'disabled',
    allowedOrigins: allowedOrigins.length,
    mongodb: mongodbConnected ? 'connected' : 'disconnected'
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
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🤖 AI Model: ${process.env.OPENAI_MODEL || 'gpt-5-nano'}`);
  console.log(`💰 Cost limit: $${process.env.MAX_MONTHLY_COST_PER_USER || '2.50'}/user/month`);
  console.log(`📊 Caching: ${process.env.ENABLE_SMART_CACHING === 'true' ? 'enabled' : 'disabled'}`);
  console.log(`🌐 CORS: ${allowedOrigins.length} allowed origins`);
  console.log('=====================================');
});