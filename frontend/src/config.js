const config = {
  API_URL: process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000',
  ENDPOINTS: {
    WORDS: '/api/words',
    DATABASE_INFO: '/api/database-info',
    GENERATE_QUESTIONS: '/api/questions/generate',
  },
};

export default config;