const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();

// Supabase client oluştur
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Güvenlik middleware'leri
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting - Render.com ücretsiz plan için önemli
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100, // IP başına maksimum 100 istek
  message: {
    error: 'Çok fazla istek gönderildi, lütfen 15 dakika sonra tekrar deneyin.'
  }
});
app.use(limiter);

// JSON parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Supabase client'ı tüm route'larda kullanabilmek için middleware
app.use((req, res, next) => {
  req.supabase = supabase;
  next();
});

// Supabase bağlantısını test et
async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('words')
      .select('count', { count: 'exact', head: true });
    
    if (error && error.code !== 'PGRST116') { // Table doesn't exist hatası normal
      console.log('⚠️ Supabase uyarısı:', error.message);
      console.log('📝 Lütfen "words" tablosunu Supabase dashboard\'tan oluşturun');
    } else {
      console.log('✅ Supabase bağlantısı başarılı');
    }
  } catch (error) {
    console.error('❌ Supabase bağlantı hatası:', error.message);
  }
}

// Uygulama başladığında bağlantıyı test et
testSupabaseConnection();

// Routes
const wordRoutes = require('./routes/words');
app.use('/api/words', wordRoutes);

// Health check endpoint - Render.com için önemli
app.get('/health', async (req, res) => {
  try {
    // Supabase bağlantısını test et
    const { error } = await supabase
      .from('words')
      .select('count', { count: 'exact', head: true });
    
    const dbStatus = error && error.code !== 'PGRST116' ? 'Error' : 'Connected';
    
    res.status(200).json({ 
      status: 'OK', 
      message: 'English Quiz API çalışıyor',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      supabase: {
        url: process.env.SUPABASE_URL ? 'Set' : 'Not Set',
        key: process.env.SUPABASE_ANON_KEY ? 'Set' : 'Not Set'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Sağlık kontrolü başarısız',
      error: error.message
    });
  }
});

// Ana route
app.get('/', (req, res) => {
  res.json({ 
    message: 'English Quiz Backend API with Supabase',
    version: '1.0.0',
    database: 'Supabase PostgreSQL',
    endpoints: {
      health: '/health',
      words: '/api/words'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint bulunamadı',
    requestedUrl: req.originalUrl
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('❌ Server Error:', error);
  res.status(500).json({ 
    error: 'Sunucu hatası oluştu',
    message: process.env.NODE_ENV === 'development' ? error.message : 'İç sunucu hatası'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server ${PORT} portunda çalışıyor`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🗄️ Database: Supabase PostgreSQL`);
});