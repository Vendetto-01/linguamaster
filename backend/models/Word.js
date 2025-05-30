const mongoose = require('mongoose');

const WordSchema = new mongoose.Schema({
  // Ana kelime
  word: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  
  // Kelime türü (noun, verb, adjective, etc.)
  partOfSpeech: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  
  // Kelimenin anlamı/tanımı
  definition: {
    type: String,
    required: true,
    trim: true
  },
  
  // Sesli okunuş (opsiyonel)
  phonetic: {
    type: String,
    default: null
  },
  
  // Örnek cümle (opsiyonel)
  example: {
    type: String,
    default: null
  },
  
  // Kelimenin kökeni/etimolojisi (opsiyonel)
  origin: {
    type: String,
    default: null
  },
  
  // Eş anlamlı kelimeler
  synonyms: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  
  // Zıt anlamlı kelimeler
  antonyms: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  
  // Kaynak bilgisi (hangi API'den geldiği)
  source: {
    type: String,
    default: 'dictionary-api'
  },
  
  // Quiz istatistikleri
  quizStats: {
    timesShown: {
      type: Number,
      default: 0
    },
    timesCorrect: {
      type: Number,
      default: 0
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    }
  },
  
  // Meta veriler
  isActive: {
    type: Boolean,
    default: true
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index: aynı kelime + part of speech + definition kombinasyonunun tekrarını engeller
WordSchema.index({ 
  word: 1, 
  partOfSpeech: 1, 
  definition: 1 
}, { 
  unique: true,
  name: 'word_pos_definition_unique'
});

// Text search için index
WordSchema.index({ 
  word: 'text', 
  definition: 'text',
  example: 'text'
});

// Pre-save middleware: updatedAt'i otomatik güncelle
WordSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static methodlar
WordSchema.statics.findByWord = function(word) {
  return this.find({ word: word.toLowerCase() });
};

WordSchema.statics.findByPartOfSpeech = function(pos) {
  return this.find({ partOfSpeech: pos.toLowerCase() });
};

WordSchema.statics.getRandomWords = function(limit = 10) {
  return this.aggregate([
    { $match: { isActive: true } },
    { $sample: { size: limit } }
  ]);
};

// Instance methodlar
WordSchema.methods.updateQuizStats = function(isCorrect) {
  this.quizStats.timesShown += 1;
  if (isCorrect) {
    this.quizStats.timesCorrect += 1;
  }
  
  // Zorluk seviyesini otomatik ayarla
  const correctRatio = this.quizStats.timesCorrect / this.quizStats.timesShown;
  if (correctRatio > 0.8) {
    this.quizStats.difficulty = 'easy';
  } else if (correctRatio > 0.5) {
    this.quizStats.difficulty = 'medium';
  } else {
    this.quizStats.difficulty = 'hard';
  }
  
  return this.save();
};

module.exports = mongoose.model('Word', WordSchema);