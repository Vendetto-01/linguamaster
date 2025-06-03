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
  req.wordProcessor = wordProcessor; // Worker'a erişim için
  next();
});

// Health check endpoint (Render.com için gerekli)
app.get('/', (req, res) => {
  const stats = wordProcessor.getStats();
  res.json({
    status: 'OK',
    message: 'Word Wizard Backend API',
    version: '2.0',
    aiModel: 'gemini-2.0-flash-001',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
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

// System info endpoint
app.get('/api/system/info', (req, res) => {
  res.json({
    appName: 'Word Wizard',
    version: '2.0',
    aiModel: 'gemini-2.0-flash-001',
    lastUpdated: new Date().toISOString(),
    features: [
      'Queue-based background processing',
      'Gemini 2.0 Flash AI integration',
      'Real-time progress tracking',
      'Turkish language analysis',
      'Difficulty level detection',
      'Multi-meaning support'
    ],
    database: 'Supabase PostgreSQL',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Word processor kontrolü için endpoint'ler
app.post('/api/processor/start', async (req, res) => {
  try {
    if (wordProcessor.getStats().isProcessing) {
      return res.json({
        message: 'Word processor zaten çalışıyor',
        stats: wordProcessor.getStats()
      });
    }

    // Async olarak başlat (background'da çalışsın)
   console.log('⚙️ Word processor starting...'); // Added log
   wordProcessor.startProcessing().catch(error => {
     console.error('❌ Background processing hatası:', error);
   });
   console.log('✅ Word processor started'); // Added log

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
    console.log('⚙️ Word processor stopping...'); // Added log
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
      'GET /api/system/info',
      'GET /api/words',
      'POST /api/words/bulk',
      'POST /api/words/bulk-stream',
      'POST /api/words/upload-file',
      'GET /api/words/queue-stats',
      'POST /api/processor/start',
      'POST /api/processor/stop',
      'GET /api/processor/stats'
    ]
  });
});

// Error handler
function errorHandler(error, req, res, next) {
  console.error('❌ Server Error:', error);

  let statusCode = error.statusCode || 500;
  let errorMessage = 'Sunucu hatası';

  if (process.env.NODE_ENV === 'development') {
    errorMessage = error.message;
  } else {
    console.error('❌ Server Error:', error); // Log the error in production
  }

  // Specific error handling
  if (error.code === 'PGRST116') {
    statusCode = 404;
    errorMessage = 'Veritabanı tablosu bulunamadı. Lütfen Supabase dashboard\'dan "words" tablosunu oluşturun.';
  } else if (error.code === 'ECONNABORTED') {
    statusCode = 408;
    errorMessage = 'İstek zaman aşımına uğradı. Lütfen daha sonra tekrar deneyin.';
  }

  res.status(statusCode).json({
    error: 'Sunucu hatası',
    message: errorMessage
  });
}

app.use(errorHandler);

function validateEnvVariables() {
  const requiredEnvVariables = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'FRONTEND_URL'];

  requiredEnvVariables.forEach(function(variable) {
    if (!process.env[variable]) {
      console.error(`❌ ${variable} environment variable is required`);
      process.exit(1);
    }
  });
}

validateEnvVariables();

// Server'ı başlat
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server ${PORT} portunda çalışıyor`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Supabase URL: ${supabaseUrl}`);
  console.log(`🤖 AI Model: Gemini 2.0 Flash`);
  console.log(`⏰ Başlatma zamanı: ${new Date().toISOString()}`);
  console.log('✅ Server started successfully'); // Added log

  // 5 saniye sonra word processor'ı başlat
  setTimeout(() => {
    checkPendingWords(supabase, wordProcessor);
  }, 5000);
});

async function checkPendingWords(supabase, wordProcessor) {
  console.log('🔍 Pending words kontrol ediliyor...');
  try {
    const { count, error } = await supabase
      .from('pending_words')
      .select('*', { count: 'exact', head: true });

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
    console.log('✅ Pending words check completed'); // Added log
  } catch (error) {
    console.error('❌ Pending words kontrol hatası:', error);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM signal alındı, sunucu kapatılıyor...');
  wordProcessor.stopProcessing();
  console.log('✅ Word processor stopped'); // Added log
  server.close(() => {
    console.log('✅ HTTP server kapatıldı');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT signal alındı, sunucu kapatılıyor...');
  wordProcessor.stopProcessing();
  console.log('✅ Word processor stopped'); // Added log
  server.close(() => {
    console.log('✅ HTTP server kapatıldı');
    process.exit(0);
  });
});

module.exports = app;