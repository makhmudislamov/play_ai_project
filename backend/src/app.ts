
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';


dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());


// console.log('Checking env:', {
//     hasApiKey: !!process.env.PLAY_AI_API_KEY,
//     hasUserId: !!process.env.PLAY_AI_USER_ID
//   });


  app.post('/api/tts/generate', async (req, res) => {
    try {
      const { text } = req.body;
      // console.log('Generating speech with mini model for text length:', text.length);
      const startTime = Date.now(); // Add timing log
  
      const response = await fetch('https://api.play.ai/api/v1/tts/stream', {
        method: 'POST',
        headers: {
          'AUTHORIZATION': process.env.PLAY_AI_API_KEY!,
          'X-USER-ID': process.env.PLAY_AI_USER_ID!,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "Play3.0-mini",
          text: text,
          voice: "s3://voice-cloning-zero-shot/baf1ef41-36b6-428c-9bdf-50ba54682bd8/original/manifest.json",
          quality: "draft",
          outputFormat: "mp3",
          speed: 1,
          sampleRate: 24000,
          textGuidance: 1,
          language: "english"
        })
      });
  
      // console.log('API response received after:', Date.now() - startTime, 'ms');
  
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
  
      const audioData = await response.arrayBuffer();
      // console.log('Audio data processed after:', Date.now() - startTime, 'ms');
      
      res.setHeader('Content-Type', 'audio/mpeg');
      res.send(Buffer.from(audioData));
  
    } catch (error) {
      console.error('TTS API Error:', error);
      res.status(500).json({ error: 'Failed to generate speech' });
    }
  });


  
export default app;


