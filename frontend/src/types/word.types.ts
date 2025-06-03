export interface WordEntry {
  id?: number;
  word: string;
  part_of_speech: string;
  definition: string; // Bullet points as a single string
  difficulty_level: string; // e.g., A1, A2, B1
  example_sentence: string;
  option_a: string; // Correct answer
  option_b: string;
  option_c: string;
  option_d: string;
  created_at?: string; // Dates will likely be strings from JSON
  updated_at?: string; // Dates will likely be strings from JSON
  update_note?: string | null;
  placeholder_1?: any;
  placeholder_2?: any;
}

// Type for the data submitted by the user (only the word)
export interface WordSubmission {
  word: string;
}