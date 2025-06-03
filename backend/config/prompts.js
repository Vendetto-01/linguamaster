// backend/config/prompts.js - SORU ÜRETİMİ İLE GÜNCELLENMİŞ

const WORD_PROCESSOR_PROMPT_TEMPLATE = (word) => `Analyze the English word "${word}" step by step. Follow these exact steps:

STEP 1: Initial difficulty assessment
Determine the difficulty level of this word for English learners (beginner/intermediate/advanced).

STEP 2: Meaning identification  
Identify all different meanings and uses of this word in English (maximum 6). For each meaning, specify:
- A unique numeric meaning_id (starting from 1)
- The part of speech (noun, verb, adjective, adverb, preposition, conjunction, interjection)
- A brief description of that specific meaning

STEP 3: Academically Challenging Example Sentence Creation
For each meaning_id identified in Step 2, create a single, somewhat long, academically challenging English example sentence that clearly demonstrates that specific usage. Ensure the example is only one sentence.

STEP 4: Context-based difficulty verification
Look at the example sentences you created in Step 3. Based on the context and complexity of these sentences, verify or adjust the initial difficulty level from Step 1 to arrive at a final difficulty.

STEP 5: Turkish translation of sentences
Translate each English example sentence (from Step 3) into natural, fluent Turkish.

STEP 6: Word-to-word mapping
For each English sentence (from Step 3) and its Turkish translation (from Step 5), identify exactly which Turkish word(s) correspond to the original English word "${word}" in that specific context.

STEP 7: Question generation
For each meaning_id identified in Step 2, create a multiple-choice question that tests understanding of that specific meaning. Each question should:
- Have 4 options (A, B, C, D) with only one correct answer
- Be appropriate for the word's difficulty level
- Include a brief explanation of why the correct answer is right
- Use the context from the example sentences when relevant

Respond ONLY with a valid JSON object in this exact format:
{
  "word": "${word}",
  "step1_initial_difficulty": "beginner|intermediate|advanced",
  "step2_meanings": [
    {
      "meaning_id": 1,
      "part_of_speech": "noun|verb|adjective|etc",
      "meaning_description": "brief description of this specific meaning"
    }
  ],
  "step3_examples": [
    {
      "meaning_id": 1,
      "english_sentence": "the single, somewhat long, academically challenging example sentence from Step 3"
    }
  ],
  "step4_final_difficulty": "beginner|intermediate|advanced",
  "step4_difficulty_reasoning": "explanation for the final difficulty decision from Step 4",
  "step5_turkish_translations": [
    {
      "meaning_id": 1,
      "english_sentence": "same English sentence from step 3 for this meaning_id",
      "turkish_sentence": "Turkish translation of the sentence"
    }
  ],
  "step6_word_mappings": [
    {
      "meaning_id": 1,
      "english_word": "${word}",
      "turkish_equivalent": "the specific Turkish word(s) that correspond to the English word in this context"
    }
  ],
  "step7_questions": [
    {
      "meaning_id": 1,
      "question_text": "Complete question here",
      "option_a": "First option",
      "option_b": "Second option", 
      "option_c": "Third option",
      "option_d": "Fourth option",
      "correct_answer": "A|B|C|D",
      "explanation": "Why this answer is correct",
      "difficulty": "beginner|intermediate|advanced"
    }
  ]
}

- Include ALL common meanings of the word (maximum 6 meanings).
- Use standard part of speech terms.
- Example sentences in "step3_examples" MUST BE a single, somewhat long, academically challenging sentence per meaning.
- Turkish translations must be fluent and natural.
- Word mappings should be precise.
- Questions should test comprehension of the specific meaning, not general knowledge.
- Each question must have exactly 4 options and 1 correct answer.
- Explanations should be brief but clear.
- Ensure the entire response is a single, valid JSON object.`;

module.exports = {
  WORD_PROCESSOR_PROMPT_TEMPLATE: WORD_PROCESSOR_PROMPT_TEMPLATE,
  QUESTION_GENERATOR_PROMPT_TEMPLATE: (word, meaning) => `Generate a multiple-choice question about the word "${word}" in the context of the following meaning: "${meaning}".
  The question should have four options (A, B, C, D), with only one correct answer.
  Also, provide a short explanation of why the correct answer is correct.
  The question should be appropriate for the difficulty level of the word (beginner, intermediate, or advanced).

  Respond ONLY with a valid JSON object in this exact format:
  {
    "question_text": "Complete question here",
    "option_a": "First option",
    "option_b": "Second option",
    "option_c": "Third option",
    "option_d": "Fourth option",
    "correct_answer": "A|B|C|D",
    "explanation": "Why this answer is correct",
    "difficulty": "beginner|intermediate|advanced"
  }
  `
};