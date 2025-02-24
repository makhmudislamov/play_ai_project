export const generateSpeech = async (text: string) => {
    const response = await fetch('/api/tts/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    });
  
    if (!response.ok) {
      throw new Error('Failed to generate speech');
    }
  
    return response.json();
  };