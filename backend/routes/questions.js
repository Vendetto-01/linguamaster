const express = require('express');
const router = express.Router();

// GET all questions
router.get('/', (req, res) => {
  res.json({ message: 'GET all questions' });
});

// GET a specific question by ID
router.get('/:id', (req, res) => {
  res.json({ message: `GET question with ID ${req.params.id}` });
});

// POST a new question
router.post('/', (req, res) => {
  res.json({ message: 'POST a new question' });
});

// PUT (update) an existing question
router.put('/:id', (req, res) => {
  res.json({ message: `PUT (update) question with ID ${req.params.id}` });
});

// DELETE a question
router.delete('/:id', (req, res) => {
  res.json({ message: `DELETE question with ID ${req.params.id}` });
});

module.exports = router;