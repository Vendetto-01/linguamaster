// frontend/src/config/appConfig.ts - TEMİZLENMİŞ VERSİYON
import type { ModuleType, WordsModuleTabId } from '../types';

export interface ModuleConfig {
  id: ModuleType;
  title: string;
  icon: string;
  description: string;
  color: string;
}

export interface WordsTabConfig {
  id: WordsModuleTabId;
  label: string;
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