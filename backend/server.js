require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { testConnection } = require('./config/database');
const routes = require('./routes');
const PortalScheduler = require('./utils/portalScheduler');
const { initRedis } = require('./config/redisClient');
const path = require('path');
const compression = require('compression');

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');

// 1) Early CORS + Private Network Access configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
].filter(Boolean);

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  preflightContinue: false,
  optionsSuccessStatus: 200,
};

// Preflight handler for all routes
app.options('*', cors(corsOptions), (req, res) => {
  res.header('Access-Control-Allow-Private-Network', 'true');
  res.sendStatus(200);
});

// Apply CORS and PNA header to all other requests
app.use((req, res, next) => {
  cors(corsOptions)(req, res, () => {
    res.header('Access-Control-Allow-Private-Network', 'true');
    next();
  });
});

// 2) Security & utility middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Added unsafe-inline for inline scripts
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"], // Added Google Fonts
      styleSrcElem: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"], // Explicit style-src-elem
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"], // Added Google Fonts
      connectSrc: ["'self'", process.env.FRONTEND_URL || 'http://localhost:5173', "ws:", "wss:"],
      frameSrc: ["'self'", "https://www.google.com", "https://*.google.com", "https://*.gstatic.com"], // Fixed protocol
    }
  }
}));

// 3) CSRF configuration 
app.use(express.json());
app.use(cookieParser());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  allowedHeaders: ['Content-Type', 'X-CSRF-Token'], // Remove Authorization header
}));

// 4) Logging
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// 5) Rate limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Too many requests, please try again later.'
});
// Apply rate limiting to both old and new auth routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password', authLimiter);
app.use('/api/auth/verify-email', authLimiter);
app.use('/api/auth/resend-verification', authLimiter);
// Add rate limiting for tab-based auth routes
app.use('/api/tab/*/auth/login', authLimiter);
app.use('/api/tab/*/auth/register', authLimiter);
app.use('/api/tab/*/auth/resend-verification', authLimiter);

// 6) Test DB connection
testConnection();

// 7) Initialize Redis
initRedis().catch((e) => {
  console.error('Failed to initialize Redis:', e);
  process.exit(1);
});

// 8) HTTP & Socket.IO setup
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: corsOptions
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-user', ({ userId, role }) => {
    socket.join(`user-${userId}`);
    if (role === 'admin') {
      socket.join('admin-room');
    }
    console.log(`User ${userId} joined rooms`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// make io accessible via app if you want to notify session events
app.set('io', io);

// 9) Initialize portal scheduler
const portalScheduler = new PortalScheduler(io);
app.set('portalScheduler', portalScheduler);

// 10) Routes
app.use('/api', routes);

app.get('/api/health', (req, res) => {
  res.json({ message: 'Hostel Management System API', status: 'ok' });
});

// 11) Serve static assets (JS/CSS/images) from the built SPA
const frontendDist = path.resolve(__dirname, '..', 'frontend', 'dist');
app.use(
  express.static(frontendDist, {
    maxAge: '1d', // cache static assets for a day in production; adjust as you wish
    index: false, // don't automatically serve index.html for directory requests
  })
);

// 12) SPA fallback: only for GET requests and not for API or Socket.IO routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) return next();

  // 13) serve index.html (do not cache index.html aggressively)
  res.sendFile(path.join(frontendDist, 'index.html'), {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  }, (err) => {
    if (err) next(err);
  });
});

// 14) After app.use('/api', routes); and before the SPA/static catch-all and 404 handlers:
app.get('/robots.txt', (req, res) => {
  const baseUrl = process.env.SITE_URL || `${req.protocol}://${req.get('host')}`;
  res.type('text/plain').send(
  `User-agent: *
  Allow: /
  Disallow: /api
  Disallow: /management
  Sitemap: ${baseUrl}/sitemap.xml`
    );
});

// 15) Dynamic sitemap of public pages
app.get('/sitemap.xml', (req, res) => {
  const baseUrl = process.env.SITE_URL || `${req.protocol}://${req.get('host')}`;
  const urls = [
    { loc: '/', priority: 1.0, changefreq: 'daily' },
    { loc: '/about', priority: 0.7, changefreq: 'monthly' },
    { loc: '/contact', priority: 0.6, changefreq: 'monthly' },
    { loc: '/rooms', priority: 0.8, changefreq: 'daily' },
    { loc: '/services', priority: 0.7, changefreq: 'monthly' },
    { loc: '/faq', priority: 0.6, changefreq: 'monthly' },
    { loc: '/terms', priority: 0.3, changefreq: 'yearly' },
    { loc: '/privacy', priority: 0.3, changefreq: 'yearly' },
    { loc: '/rules', priority: 0.5, changefreq: 'yearly' },
  ];

  // 16) SEO configuration
const lastmod = new Date().toISOString();
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls.map(u => `
    <url>
      <loc>${baseUrl}${u.loc}</loc>
      <lastmod>${lastmod}</lastmod>
      <changefreq>${u.changefreq}</changefreq>
      <priority>${u.priority}</priority>
    </url>`).join('')}
</urlset>`;
    res.type('application/xml').send(xml);
});

// 17) 404 handler
app.use((req, res) => {
  res.status(404).json({ status: 'error', message: 'Route not found' });
});

// 18) Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ status: 'error', message: err.message || 'Internal Server Error' });
});

// 19) Start server
const PORT = process.env.PORT || 5500;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});