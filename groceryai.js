require('dotenv').config();
const http = require('http');

const apiKey = process.env.OPENROUTER_API_KEY;
//checking api key
console.log("API key loaded:", apiKey ? "YES" : "NO — check your .env file");
const apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
//vision models 
const visionModels = [
  'nvidia/nemotron-nano-12b-v2-vl:free',   // vl = vision-language
  'meta-llama/llama-3.2-11b-vision-instruct:free',
  'meta-llama/llama-3.2-90b-vision-instruct:free'
];

//trying multiple models (only works for text)
const freeModels = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'meta-llama/llama-3.2-3b-instruct:free',
  'qwen/qwen3-coder:free',
  'openai/gpt-oss-120b:free',
  'openai/gpt-oss-20b:free',
  'moonshotai/kimi-k2.6:free',
  'google/gemma-4-31b-it:free',
  'google/gemma-4-26b-a4b-it:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'nvidia/nemotron-3-nano-30b-a3b:free',
  'nvidia/nemotron-nano-12b-v2-vl:free',
  'nvidia/nemotron-nano-9b-v2:free',
  'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
  'qwen/qwen3-next-80b-a3b-instruct:free',
  'z-ai/glm-4.5-air:free',
  'liquid/lfm-2.5-1.2b-thinking:free',
  'liquid/lfm-2.5-1.2b-instruct:free',
  'cognitivecomputations/dolphin-mistral-24b-venice-edition:free',
  'nousresearch/hermes-3-llama-3.1-405b:free',
  'poolside/laguna-xs.2:free',
  'poolside/laguna-m.1:free',
  'openrouter/owl-alpha',
  'openrouter/free'
];


const server = http.createServer((req, res) => {
  //console logs for debugging
  console.log("Incoming request:", req.method, req.url);
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

        //checking if code is running bc of console logs not showing :(
        console.log("Recipe handler reached");
        console.log("URL hit:", req.url); 
        //starting image analysis
        console.log("STARTING FRIDGE SCAN");

        try {
          const body = JSON.parse(Buffer.concat(chunks).toString()); //parse into body first
          const { image } = body;
           console.log("Image received:", body.image ? "YES" : "NO");

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


          //trial and error with multiple free models
          //basically 
          let data = null;
          let lastError = null;

          for (const model of visionModels) {
            console.log("Scan trying model:", model);
            const response = await fetch(apiUrl, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost',
                'X-Title': 'Grocery AI'
              },
              body: JSON.stringify({ model, messages })
            });

            data = await response.json();
            console.log("Scan status:", response.status, "| Model:", model);
            console.log("Scan response:", JSON.stringify(data, null, 2));

            if (data.choices?.[0]?.message?.content) {
              console.log("Scan succeeded with:", model);
              break;
            }

            lastError = data.error?.message || "No content";
            console.log("Scan failed:", lastError, "— trying next model");
            data = null;
          }

          if (!data) {
            throw new Error("All scan models failed: " + lastError);
          }

          //recieving output and cleaning

          const raw = data.choices?.[0]?.message?.content ?? '[]';
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
    "directions": ["Step 1 instruction", "Step 2 instruction", "Step 3 instruction"]
  }
]`;

        // Fresh message each time — no conversation history for recipe generation
        const messages = [
          {
            role: 'system',
            content: 'You are a recipe generator. Always respond with only a raw JSON array. Never include markdown, explanations, or extra text.'
          },
          {
            role: 'user',
            content: [{ type: "text", text: promptText }]
          }
        ];
        //testing all models until one works
         let data = null;
        let lastError = null;

        for (const model of freeModels) {
          console.log("Trying model:", model);
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'http://localhost',
              'X-Title': 'Grocery AI'
            },
          body: JSON.stringify({ model, messages })
        });

        data = await response.json();
        //logging every response to see why recipe ends up empty
        console.log("Status:", response.status, "| Model:", model);

          if (data.choices?.[0]?.message?.content) {
            console.log("Success with model:", model);
            break;
          }

          lastError = data.error?.message || "No content";
          console.log("Failed:", lastError, "— trying next model");
          data = null;
        }

        if (!data) {
          throw new Error("All models failed. Last error: " + lastError);
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
        res.end(JSON.stringify({ recipe: clean }));   // Send as string

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
