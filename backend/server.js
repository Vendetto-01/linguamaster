const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');
const WordProcessor = require('./services/wordProcessor');
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

// Word Processor'ı başlat
const wordProcessor = new WordProcessor(supabase);

// Supabase middleware
app.use((req, res, next) => {
  req.supabase = supabase;
  req.wordProcessor = wordProcessor;
  next();
});

// Health check endpoint (Render.com için gerekli)
app.get('/', (req, res) => {
  const stats = wordProcessor.getStats();
  res.json({
    status: 'OK',
    message: 'Word Wizard Backend API - Simplified Version',
    version: '2.1',
    aiModel: 'gemini-2.0-flash-001',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    features: [
      'File Upload Processing',
      'Queue Management',
      'Background Word Processing',
      '6-Step AI Analysis'
    ],
    wordProcessor: {
      isProcessing: stats.isProcessing,
      processedCount: stats.processedCount,
      errorCount: stats.errorCount,
      elapsedTime: Math.round(stats.elapsedTime)
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  const stats = wordProcessor.getStats();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    wordProcessor: stats
  });
});

// System info endpoint - Sadeleştirilmiş
app.get('/api/system/info', (req, res) => {
  res.json({
    appName: 'Word Wizard',
    version: '2.1',
    aiModel: 'gemini-2.0-flash-001',
    lastUpdated: new Date().toISOString(),
    features: [
      'File-based bulk word upload',
      'Queue-based background processing',
      'Gemini 2.0 Flash AI integration',
      'Real-time queue monitoring',
      'Turkish language analysis',
      '6-step word analysis system'
    ],
    database: 'Supabase PostgreSQL',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Word processor kontrolü için endpoint'ler - Sadeleştirilmiş
app.post('/api/processor/start', async (req, res) => {
  try {
    if (wordProcessor.getStats().isProcessing) {
      return res.json({
        message: 'Word processor zaten çalışıyor',
        stats: wordProcessor.getStats()
      });
    }

    // Async olarak başlat (background'da çalışsın)
    wordProcessor.startProcessing().catch(error => {
      console.error('❌ Background processing hatası:', error);
    });

    res.json({
      message: 'Word processor başlatıldı',
      stats: wordProcessor.getStats()
    });

  } catch (error) {
    console.error('❌ Processor start hatası:', error);
    res.status(500).json({
      error: 'Processor başlatılamadı',
      message: error.message
    });
  }
});

app.post('/api/processor/stop', (req, res) => {
  try {
    wordProcessor.stopProcessing();
    res.json({
      message: 'Word processor durduruluyor',
      stats: wordProcessor.getStats()
    });
  } catch (error) {
    console.error('❌ Processor stop hatası:', error);
    res.status(500).json({
      error: 'Processor durdurulamadı',
      message: error.message
    });
  }
});

app.get('/api/processor/stats', (req, res) => {
  try {
    res.json({
      stats: wordProcessor.getStats(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Processor stats hatası:', error);
    res.status(500).json({
      error: 'Stats alınamadı',
      message: error.message
    });
  }
});

// Routes - Sadece words route'u
const wordRoutes = require('./routes/words');
app.use('/api/words', wordRoutes);

// 404 handler - Güncellenmiş endpoint listesi
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint bulunamadı',
    message: `${req.method} ${req.originalUrl} endpoint'i mevcut değil`,
    availableEndpoints: [
      'GET /',
      'GET /health',
      'GET /api/system/info',
      'POST /api/words/upload-file',
      'GET /api/words/queue-status/:batchId',
      'GET /api/words/queue-stats',
      'DELETE /api/words/clear (dev only)',
      'POST /api/processor/start',
      'POST /api/processor/stop',
      'GET /api/processor/stats'
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
      message: 'Lütfen Supabase dashboard\'dan gerekli tabloları oluşturun'
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

// Server'ı başlat
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Word Wizard Server ${PORT} portunda çalışıyor`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Supabase URL: ${supabaseUrl}`);
  console.log(`🤖 AI Model: Gemini 2.0 Flash`);
  console.log(`📁 Core Features: File Upload + Queue Processing`);
  console.log(`⏰ Başlatma zamanı: ${new Date().toISOString()}`);
  
  // 5 saniye sonra word processor'ı kontrol et
  setTimeout(() => {
    console.log('🔍 Pending words kontrol ediliyor...');
    supabase
      .from('pending_words')
      .select('*', { count: 'exact', head: true })
      .then(({ count, error }) => {
        if (error) {
          console.error('❌ Pending words kontrol hatası:', error);
          return;
        }
        
        if (count && count > 0) {
          console.log(`📋 ${count} kelime pending, processor başlatılıyor...`);
          wordProcessor.startProcessing().catch(error => {
            console.error('❌ Auto-start processing hatası:', error);
          });
        } else {
          console.log('✅ Pending words yok, processor bekleme modunda');
        }
      });
  }, 5000);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM signal alındı, sunucu kapatılıyor...');
  wordProcessor.stopProcessing();
  server.close(() => {
    console.log('✅ HTTP server kapatıldı');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT signal alındı, sunucu kapatılıyor...');
  wordProcessor.stopProcessing();
  server.close(() => {
    console.log('✅ HTTP server kapatıldı');
    process.exit(0);
  });
});

module.exports = app;