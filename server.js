require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

async function makeGroqRequest(prompt, retries = 3) {
  const fetch = (await import('node-fetch')).default;
  
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{
            role: 'user',
            content: prompt
          }],
          max_tokens: 200,
          temperature: 0.3
        })
      });

      if (response.status === 429) {
        const waitTime = Math.pow(2, i) * 1000;
        console.log(`Rate limited, waiting ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.log('API Error Response:', errorText);
        throw new Error(`API Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}
console.log('API Key:', process.env.GROQ_API_KEY);
app.post('/api/translate', async (req, res) => {
  try {
    const { word } = req.body;
    const data = await makeGroqRequest(`Translate the word "${word}" to Bengali. Give only the Bengali translation, nothing else.`);
    const translation = data.choices?.[0]?.message?.content?.trim() || 'Translation not found';
    res.json({ translation });
  } catch (error) {
    console.error('Translation error:', error);
    res.json({ translation: 'Error occurred during translation' });
  }
});

app.get('/api/dictionary/:word', async (req, res) => {
  try {
    const { word } = req.params;
    const data = await makeGroqRequest(`For the word "${word}", provide exactly 15 synonyms and 10 antonyms. Use only common, familiar English words that are logically related. Format your response as: Synonyms: word1, word2, word3, word4, word5, word6, word7, word8, word9, word10, word11, word12, word13, word14, word15 | Antonyms: word1, word2, word3, word4, word5, word6, word7, word8, word9, word10`);
    
    const text = data.choices?.[0]?.message?.content || '';
    const synonyms = [];
    const antonyms = [];
    
    const synMatch = text.match(/Synonyms:\s*([^|\n]+)/i);
    const antMatch = text.match(/Antonyms:\s*(.+)/i);
    
    if (synMatch) {
      synonyms.push(...synMatch[1].split(',').map(w => w.trim()).filter(w => w));
    }
    if (antMatch) {
      antonyms.push(...antMatch[1].split(',').map(w => w.trim()).filter(w => w));
    }

    res.json({ 
      synonyms: synonyms.slice(0, 15), 
      antonyms: antonyms.slice(0, 10) 
    });
  } catch (error) {
    console.error('Dictionary error:', error);
    res.json({ synonyms: [], antonyms: [] });
  }
});

app.post('/api/analyze', async (req, res) => {
  try {
    const { word } = req.body;
    
    // Get both translation and dictionary in one request
    const data = await makeGroqRequest(`For the word "${word}":
1. Translate to Bengali (give only Bengali translation)
2. Provide 15 synonyms and 10 antonyms using common English words

Format: Translation: [bengali_word] | Synonyms: word1, word2, word3, word4, word5, word6, word7, word8, word9, word10, word11, word12, word13, word14, word15 | Antonyms: word1, word2, word3, word4, word5, word6, word7, word8, word9, word10`);
    
    const text = data.choices?.[0]?.message?.content || '';
    
    // Parse translation
    const transMatch = text.match(/Translation:\s*([^|\n]+)/i);
    const translation = transMatch ? transMatch[1].trim() : 'Translation not found';
    
    // Parse synonyms and antonyms
    const synonyms = [];
    const antonyms = [];
    
    const synMatch = text.match(/Synonyms:\s*([^|\n]+)/i);
    const antMatch = text.match(/Antonyms:\s*(.+)/i);
    
    if (synMatch) {
      synonyms.push(...synMatch[1].split(',').map(w => w.trim()).filter(w => w));
    }
    if (antMatch) {
      antonyms.push(...antMatch[1].split(',').map(w => w.trim()).filter(w => w));
    }

    res.json({ 
      translation,
      synonyms: synonyms.slice(0, 15), 
      antonyms: antonyms.slice(0, 10) 
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.json({ 
      translation: 'Error occurred during translation',
      synonyms: [], 
      antonyms: [] 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Words Helper running on http://localhost:${PORT}`);
});
