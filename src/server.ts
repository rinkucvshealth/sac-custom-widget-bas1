import express from 'express';
import cors from 'cors';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { logger } from './utils/logger';
import chatRouter from './routes/chat';

const app = express();

// Trust proxy for Cloud Foundry (fixes express-rate-limit error)
app.set('trust proxy', true);

// CORS configuration for SAC integration
const corsOptions = {
  origin: [
    'https://sonos-q.us10.hcs.cloud.sap',
    'https://sonos-q.us10.hcs.cloud.sap/sap',
    'https://sonos.us10.sapanalytics.cloud',
    config.server.allowedOrigin
  ].filter(Boolean),
  credentials: true,
  optionsSuccessStatus: 200
};

// More permissive CORS for widget files
const widgetCorsOptions = {
  origin: true, // Allow all origins for widget files
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Rate limiting - configured for Cloud Foundry proxy
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Use X-Forwarded-For header for Cloud Foundry (trust proxy is set)
  keyGenerator: (req) => {
    // Use X-Forwarded-For header if available (Cloud Foundry sets this)
    const forwardedFor = req.headers['x-forwarded-for'] as string;
    if (forwardedFor) {
      // Get the first IP (original client IP)
      return forwardedFor.split(',')[0].trim();
    }
    // Fallback to connection remote address
    return req.ip || req.socket.remoteAddress || 'unknown';
  }
});

app.use('/api/', limiter);

// API key authentication middleware - DISABLED FOR LOCAL DEVELOPMENT
const apiKeyAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Skip authentication for local development
  if (config.app.nodeEnv === 'development') {
    logger.debug('Skipping API key authentication for local development');
    return next();
  }
  
  const apiKey = req.headers['x-api-key'] as string;
  if (!apiKey || apiKey !== config.server.apiKey) {
    logger.warn(`Unauthorized API access attempt from ${req.ip}`);
    return res.status(401).json({ 
      success: false, 
      error: 'Unauthorized: Invalid API key' 
    });
  }
  
  next();
};

// Apply API key auth to all API routes
app.use('/api/', apiKeyAuth);

// API routes
app.use('/api/chat', chatRouter);

// Serve widget files with permissive CORS and specific headers
app.use('/widget', cors(widgetCorsOptions), (req, res, next) => {
  // Add specific headers for SAC widget validation
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
}, express.static(path.join(__dirname, '../widget'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json');
    }
  }
}));

// Dedicated endpoint for widget.js with explicit headers
app.get('/widget/widget.js', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(__dirname, '../widget/widget-rinku.js'));
});

// Dedicated endpoint for widget.json with explicit headers
app.get('/widget/widget.json', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(__dirname, '../widget/widget-rinku.json'));
});

// Dedicated endpoint for widget-rinku.js with explicit headers
app.get('/widget/widget-rinku.js', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(__dirname, '../widget/widget-rinku.js'));
});

// Dedicated endpoint for widget-rinku.json with explicit headers
app.get('/widget/widget-rinku.json', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(__dirname, '../widget/widget-rinku.json'));
});

// Serve test.html file
app.get('/test.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../test.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'SAC Custom Widget API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      chat: '/api/chat/query',
      widget: '/widget/widget-rinku.json'
    }
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Express error:', err);
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// Start server
const PORT = config.server.port;

app.listen(PORT, () => {
  logger.info(`SAC Custom Widget server running on port ${PORT}`);
  logger.info(`Widget files available at http://localhost:${PORT}/widget/`);
  logger.info(`API endpoints available at http://localhost:${PORT}/api/`);
  logger.info(`Environment: ${config.app.nodeEnv}`);
});

export default app;

