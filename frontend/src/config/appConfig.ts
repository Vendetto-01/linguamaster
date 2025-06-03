// frontend/src/config/appConfig.ts
// Bu tipler App.tsx'den veya types/index.ts'ten gelebilir.
// Şimdilik konfigürasyonla birlikte burada tanımlıyoruz.
export type ModuleType = 'words' | 'questions';
export type WordsTabType = 'file' | 'queue' | 'database';
// QuestionsTabType QuestionsModule içinde kullanılıyor, gerekirse o da buraya veya types/index.ts'e taşınabilir.

export interface ModuleConfig {
  id: ModuleType;
  title: string;
  icon: string;
  description: string;
  color: string;
}

export interface WordsTabConfig {
  id: WordsTabType;
  label:string;
  icon: string;
  description: string;
}

export const modules: ModuleConfig[] = [
  {
    id: 'words',
    title: 'Kelime Yönetimi',// frontend/src/config/appConfig.ts - GÜNCELLENMİŞ VERSİYON
import type { ModuleType, WordsModuleTabId } from '../types'; // Tipler ../types'tan import edildi

// ModuleType ve WordsTabType lokal tanımları kaldırıldı.

export interface ModuleConfig { // Bu arayüz burada kalabilir veya types/index.ts'teki ModuleConfigApp kullanılabilir
  id: ModuleType; // Import edilen ModuleType kullanılıyor
  title: string;
  icon: string;
  description: string;
  color: string;
}

export interface WordsTabConfig { // Bu arayüz burada kalabilir veya types/index.ts'teki WordsTabConfigApp kullanılabilir
  id: WordsModuleTabId; // Import edilen WordsModuleTabId kullanılıyor
  label:string;
  icon: string;
  description: string;
}

export const modules: ModuleConfig[] = [
  {
    id: 'words',
    title: 'Kelime Yönetimi',
    icon: '📚',
    description: 'Toplu kelime yükleme, AI analiz ve veritabanı yönetimi',
    color: '#007bff'
  },
  {
    id: 'questions',
    title: 'Soru Yönetimi', 
    icon: '❓',
    description: 'Kelime seçimi, soru oluşturma ve yönetimi',
    color: '#28a745'
  }
];

export const wordsTabs: WordsTabConfig[] = [
  {
    id: 'file',
    label: 'Dosya Yükleme',
    icon: '📁',
    description: 'Toplu kelime yükleme (.txt dosyası)'
  },
  {
    id: 'queue',
    label: 'Queue Durumu',
    icon: '📊',
    description: 'Aşamalı işleme durumu ve queue takibi'
  },
  {
    id: 'database',
    label: 'Veritabanı',
    icon: '🗄️',
    description: 'Kelime veritabanı görüntüleme ve istatistikler'
  }
];

export const APP_VERSION = '3.0 Admin';
export const AI_MODEL_NAME = 'Gemini 2.0 Flash AI';
export const DATABASE_PROVIDER = 'Supabase DB';