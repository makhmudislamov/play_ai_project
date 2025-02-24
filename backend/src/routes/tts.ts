
import express from 'express';
const router = express.Router();

router.post('/generate', async (req, res) => {
  try {
    const { text } = req.body;
    console.log('Received text:', text); // Debug log
    
    // Send test response
    res.json({
      success: true,
      message: 'Test response',
      receivedText: text,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('TTS Error:', error);
    res.status(500).json({ error: 'Failed to generate speech' });
  }
});

export default router;