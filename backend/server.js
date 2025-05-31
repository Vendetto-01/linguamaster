const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();

// Render.com için PORT konfigürasyonu
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL, /\.render\.com$/] 
    : ['http://localhost:3000'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100, // IP başına maksimum istek
  message: {
    error: 'Çok fazla istek',
    message: 'Lütfen 15 dakika sonra tekrar deneyin'
  }
});

app.use('/api/', limiter);

// Supabase bağlantısı
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL ve SUPABASE_ANON_KEY environment variables gerekli');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Supabase middleware
app.use((req, res, next) => {
  req.supabase = supabase;
  next();
});

// Health check endpoint (Render.com için gerekli)
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'English Quiz Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Routes
const wordRoutes = require('./routes/words');
app.use('/api/words', wordRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint bulunamadı',
    message: `${req.method} ${req.originalUrl} endpoint'i mevcut değil`,
    availableEndpoints: [
      'GET /',
      'GET /health',
      'GET /api/words',
      'POST /api/words/bulk',
      'POST /api/words/bulk-stream',
      'GET /api/words/stats',
      'GET /api/words/random'
    ]
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('❌ Server Error:', error);
  
  // Supabase errors
  if (error.code === 'PGRST116') {
    return res.status(404).json({
      error: 'Veritabanı tablosu bulunamadı',
      message: 'Lütfen Supabase dashboard\'dan "words" tablosunu oluşturun'
    });
  }
  
  // Network timeout
  if (error.code === 'ECONNABORTED') {
    return res.status(408).json({
      error: 'İstek zaman aşımına uğradı',
      message: 'Lütfen daha sonra tekrar deneyin'
    });
  }
  
  // Generic error
  const statusCode = error.statusCode || 500;
  const message = process.env.NODE_ENV === 'development' 
    ? error.message 
    : 'Sunucu hatası oluştu';
    
  res.status(statusCode).json({
    error: 'Sunucu hatası',
    message
  });
});

// Graceful shutdown
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server ${PORT} portunda çalışıyor`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Supabase URL: ${supabaseUrl}`);
  console.log(`⏰ Başlatma zamanı: ${new Date().toISOString()}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM signal alındı, sunucu kapatılıyor...');
  server.close(() => {
    console.log('✅ HTTP server kapatıldı');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT signal alındı, sunucu kapatılıyor...');
  server.close(() => {
    console.log('✅ HTTP server kapatıldı');
    process.exit(0);
  });
});

module.exports = app;