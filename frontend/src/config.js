const config = {
  API_URL: process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000',
  ENDPOINTS: {
    WORDS: '/api/words',
    DATABASE_INFO: '/api/questionWizard/database-info',
    GENERATE_QUESTIONS: '/api/questionWizard/questions/generate',
  },
};

export default config;