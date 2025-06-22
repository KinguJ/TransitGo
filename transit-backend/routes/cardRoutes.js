const express = require('express');
const router = express.Router();
const Card = require('../models/Card');
const auth = require('../middleware/auth');

// @route   GET /api/cards
// @desc    Get user's cards
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const cards = await Card.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(cards);
  } catch (error) {
    console.error('Error fetching cards:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/cards
// @desc    Create a new card
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { name, cardNumber, balance, expiryDate } = req.body;

    // Check if card number already exists
    const existingCard = await Card.findOne({ cardNumber });
    if (existingCard) {
      return res.status(400).json({ message: 'Card number already exists' });
    }

    const newCard = new Card({
      userId: req.user.id,
      name: name || 'Transit Card',
      cardNumber,
      balance: balance || 0,
      expiryDate: expiryDate || new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000) // 5 years from now
    });

    const savedCard = await newCard.save();
    res.status(201).json(savedCard);
  } catch (error) {
    console.error('Error creating card:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/cards/:id
// @desc    Update card name and/or balance
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, balance } = req.body;
    
    const card = await Card.findOne({ _id: req.params.id, userId: req.user.id });
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    // Update fields if provided
    if (name !== undefined) {
      card.name = name;
    }
    if (balance !== undefined) {
      card.balance = balance;
    }
    
    await card.save();
    
    res.json(card);
  } catch (error) {
    console.error('Error updating card:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/cards/:id
// @desc    Delete a card
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const card = await Card.findOne({ _id: req.params.id, userId: req.user.id });
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    await Card.findByIdAndDelete(req.params.id);
    res.json({ message: 'Card deleted successfully' });
  } catch (error) {
    console.error('Error deleting card:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 