require('dotenv').config();
const http = require('http');

const apiKey = process.env.OPENROUTER_API_KEY;
const apiUrl = 'https://openrouter.ai';
const modelName = 'openrouter/free';

let conversationHistory = [
  { 
    role: 'system', 
    content: 'You are Grocery-AI, an expert culinary assistant and shopping list organizer. Your job is to help users with budget-friendly meal planning, recipe development, grocery lists, and kitchen inventory management. Keep answers practical, structured, and helpful.' 
  }
];

const server = http.createServer((req, res) => {
  // Setup manual CORS options for React
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Accept requests targeting both standard proxy and absolute routes
 //  To this:
  if (req.method === 'POST') {
    let chunks = [];

    // 🛠️ STREAM REFIX: Safely collect segments into an uncorrupted array buffer
    req.on('data', chunk => {
      chunks.push(chunk);
    });

    req.on('end', async () => {
      try {
        // Concat the chunks buffer directly to resolve memory fragmentation
        const rawBody = Buffer.concat(chunks).toString();
        
        if (!rawBody || rawBody.trim() === "") {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: "The request body arrived completely empty." }));
          return;
        }

        // Safe parse after full resolution
        const parsedData = JSON.parse(rawBody);
        const { image, text } = parsedData;

        let messageContent = [{ type: "text", text: text }];

        if (image) {
          messageContent.push({
            type: "image_url",
            image_url: { url: image }
          });
        }

        conversationHistory.push({ role: 'user', content: messageContent });

        // Forward safely out to OpenRouter
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost', 
            'X-Title': 'Grocery AI'
          },
          body: JSON.stringify({ 
            model: modelName, 
            messages: conversationHistory 
          })
        });

        const data = await response.json();
        
        if (data.choices && data.choices[0]) {
          const aiReply = data.choices[0].message.content;
          conversationHistory.push({ role: 'assistant', content: aiReply });
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ recipe: aiReply }));
        } else if (data.error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: `OpenRouter Error: ${data.error.message || JSON.stringify(data.error)}` }));
        } else {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: "Unexpected response format returned from OpenRouter gateway." }));
        }

      } catch (error) {
        console.error("❌ Fatal Stream Parser Crash:", error.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Internal Engine Parsing Failure: ${error.message}` }));
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Route path target not found.' }));
  }
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Grocery-AI Server initialized and stream-safeguarded on port: ${PORT}`);
});
