// backend/server.js'e bu fonksiyonları ekle

// Standart response formatı
const createResponse = (success, data, message, meta = {}) => ({
  success,
  message,
  data,
  meta: {
    timestamp: new Date().toISOString(),
    ...meta
  }
});

// Input validation middleware
const validateWordInput = (req, res, next) => {
  const { words } = req.body;
  
  // Kelime array'i kontrolü
  if (!words || !Array.isArray(words)) {
    return res.status(400).json(
      createResponse(false, null, 'Kelime listesi gerekli ve array olmalı')
    );
  }
  
  // Kelime sayısı kontrolü
  if (words.length === 0) {
    return res.status(400).json(
      createResponse(false, null, 'En az bir kelime gerekli')
    );
  }
  
  if (words.length > 50) {
    return res.status(400).json(
      createResponse(false, null, 'Maksimum 50 kelime ekleyebilirsiniz')
    );
  }
  
  // Her kelimeyi kontrol et
  const invalidWords = words.filter(word => 
    typeof word !== 'string' || 
    word.trim().length === 0 || 
    word.length > 100 ||
    !/^[a-zA-Z\s\-']+$/.test(word.trim())
  );
  
  if (invalidWords.length > 0) {
    return res.status(400).json(
      createResponse(false, null, 'Geçersiz kelimeler bulundu', { 
        invalidWords: invalidWords.slice(0, 5) 
      })
    );
  }
  
  // Temizlenmiş kelimeler
  req.validatedWords = words.map(word => word.trim().toLowerCase());
  next();
};

// Async error wrapper
const asyncWrapper = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Global error handler (en sona ekle)
const errorHandler = (error, req, res, next) => {
  console.error('❌ Server Error:', error);
  
  // Supabase errors
  if (error.code === 'PGRST116') {
    return res.status(404).json(
      createResponse(false, null, 'Veritabanı tablosu bulunamadı')
    );
  }
  
  // Network timeout
  if (error.code === 'ECONNABORTED') {
    return res.status(408).json(
      createResponse(false, null, 'İstek zaman aşımına uğradı')
    );
  }
  
  // Generic error
  const statusCode = error.statusCode || 500;
  const message = process.env.NODE_ENV === 'development' 
    ? error.message 
    : 'Sunucu hatası oluştu';
    
  res.status(statusCode).json(
    createResponse(false, null, message)
  );
};

// Routes'larda kullanım:
// app.use('/api/words', validateWordInput, wordRoutes);
// app.use(errorHandler); // En sona ekle