// frontend/src/types/index.ts - GÜNCELLENMİŞ VERSİYON

// Mevcut tipleriniz burada devam edecek...
// ... (yukarıdaki existing types)

// YENİ EKLENEN TİPLER (Kelimeler ve Kelime API Yanıtı için) - Önceki adımlardan
export interface Word {
  id: number;
  word: string;
  meaning_id: number;
  part_of_speech: string;
  meaning_description: string;
  english_example: string;
  turkish_meaning: string;
  turkish_sentence?: string;
  initial_difficulty?: string;
  final_difficulty: string;
  difficulty_reasoning?: string;
  analysis_method?: string;
  source?: string;
  times_shown?: number;
  times_correct?: number;
  is_active?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface WordsResponse {
  words: Word[];
  wordGroups?: Array<{
    word: string;
    meanings: Word[];
    totalMeanings: number;
    difficultyRange: {
        initial: string;
        final: string;
        min?: string;
        max?: string;
    };
    partOfSpeechSummary?: string[];
    analysisMethod?: string;
    createdAt?: string;
  }>;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalWords: number;
    totalMeanings: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface WordFilters {
  page?: number;
  limit?: number;
  search?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | '';
  partOfSpeech?: string;
  groupByWord?: boolean;
  difficultyType?: 'initial' | 'final';
}


// --- YENİ EKLENEN MODÜL VE SEKME TİPLERİ ---
export type ModuleType = 'words' | 'questions';

export type WordsModuleTabId = 'file' | 'queue' | 'database'; // Daha spesifik bir isim verildi (WordsTabType yerine)

export type QuestionsModuleTabId = 'selection' | 'generation' | 'management'; // Daha spesifik bir isim verildi (QuestionsTabType yerine)

// App.tsx'deki ModuleConfig ve WordsTabConfig arayüzleri de buraya taşınabilir
// veya config dosyasında kalabilirler. Şimdilik sadece ID tiplerini taşıdık.
// Eğer config objelerinin tipleri de global olacaksa, buraya almak mantıklı olur:

export interface ModuleConfigApp { // appConfig.ts'deki ModuleConfig ile karışmaması için farklı bir isim
  id: ModuleType;
  title: string;
  icon: string;
  description:string;
  color: string;
}

export interface WordsTabConfigApp { // appConfig.ts'deki WordsTabConfig ile karışmaması için farklı bir isim
  id: WordsModuleTabId;
  label: string;
  icon: string;
  description: string;
}

// QuestionsTabConfig için de benzer bir arayüz (QuestionsModule içinde tanımlıysa oradan buraya gelebilir)
export interface QuestionsTabConfigApp {
    id: QuestionsModuleTabId;
    label: string;
    icon: string;
    // QuestionsModule'ün beklediği diğer proplar eklenebilir
}


// --- MEVCUT TİPLERİNİZİN SONU ---

export default {}; // Eğer dosyanızda default export yoksa ve eklemek isterseniz