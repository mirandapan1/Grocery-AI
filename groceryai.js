require('dotenv').config();
const http = require('http');

const apiKey = process.env.OPENROUTER_API_KEY;
const apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
const modelName = 'meta-llama/llama-3.2-11b-vision-instruct:free';

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
    //responds to image from frontend and provides list of ingreidients
    if (req.url === '/api/scan') {
      let chunks = [];
      // Fridge scan: returns structured ingredient list
      req.on('data', chunk => chunks.push(chunk));
      req.on('end', async () => {
        try {
          const { image } = JSON.parse(Buffer.concat(chunks).toString());

          const messages = [{
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Look at this fridge image. List every food item you can see. Respond with ONLY a JSON array of strings, like: ["eggs", "milk", "cheese"]. No explanation, no markdown, just the raw JSON array.'
              },
              ...(image ? [{ type: 'image_url', image_url: { url: image } }] : [])
            ]
          }];

          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'http://localhost',
              'X-Title': 'Grocery AI'
            },
            body: JSON.stringify({ model: modelName, messages })
          });

          const data = await response.json();
          const raw = data.choices?.[0]?.message?.content ?? '[]';
          // Strip markdown fences if model wraps it anyway
          const clean = raw.replace(/```json|```/g, '').trim();
          const items = JSON.parse(clean);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ items }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }
    //recipe generation with fixed json parsing
    let chunks = [];

    req.on('data', chunk => {
      chunks.push(chunk);
    });

    req.on('end', async () => {
      try {
        const rawBody = Buffer.concat(chunks).toString();

        if (!rawBody || rawBody.trim() === "") {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: "Request body is empty." }));
          return;
        }

        const { image, ingredients, diet, mealType, cookingStyle, cuisine, maxTime } = JSON.parse(rawBody);

        // Build the structured prompt from explicit parameters
        const ingredientList = ingredients?.length > 0
          ? ingredients.join(', ')
          : 'whatever ingredients are available';

        const timeString = maxTime === 'any' || !maxTime
          ? 'any amount of time'
          : `${maxTime} minutes`;

        const promptText = `You are a recipe generator. Generate exactly 3 recipes using primarily these ingredients: ${ingredientList}.

User preferences:
- Diet: ${diet || 'any'}
- Meal type: ${mealType || 'any'}
- Cooking style: ${cookingStyle || 'any'}
- Cuisine: ${cuisine || 'any'}
- Max cooking time: ${timeString}

Respond with ONLY a raw JSON array, no markdown fences, no explanation. Use this exact format:
[
  {
    "title": "Recipe Name",
    "time": "__ mins",
    "ingredients": ["ingredient 1", "ingredient 2", etc],
    "directions": "Full step by step instructions as a single string in this format:" ["step 1", "step 2", etc]
  }
]`;

        let messageContent = [{ type: "text", text: promptText }];

        if (image) {
          messageContent.push({
            type: "image_url",
            image_url: { url: image }
          });
        }

        // Fresh message each time — no conversation history for recipe generation
        const messages = [
          {
            role: 'system',
            content: 'You are a recipe generator. Always respond with only a raw JSON array. Never include markdown, explanations, or extra text.'
          },
          {
            role: 'user',
            content: messageContent
          }
        ];

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost',
            'X-Title': 'Grocery AI'
          },
          body: JSON.stringify({ model: modelName, messages })
        });

        const data = await response.json();

       if (!data.choices?.[0]?.message?.content) {
          throw new Error("No content returned from AI model");
        }

        let raw = data.choices[0].message.content;
        let clean = raw.replace(/```json|```/g, '').trim();

        // Safety: If model didn't return JSON, wrap it as best as possible
        if (!clean.startsWith('[')) {
          clean = JSON.stringify([{
            title: "Custom Recipe",
            time: "30 mins",
            ingredients: ingredients || ["Unknown ingredients"],
            directions: clean || "Could not generate recipe. Please try again."
          }]);
        }

        // Final validation with try/catch
        let parsed;
        try {
          parsed = JSON.parse(clean);
        } catch (e) {
          console.error("Model returned bad JSON:", clean);
          throw new Error("AI returned invalid JSON format");
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ recipe: clean }));   // Send as string (your frontend expects this)

      } catch (error) {
        console.error("Recipe handler error:", error.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: `Server error: ${error.message}` 
        }));
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
