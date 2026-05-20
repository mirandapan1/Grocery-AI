require('dotenv').config(); 
const readline = require('readline');

// Secure Fix: Read the key from the background environment instead of hardcoding it
const apiKey = process.env.OPENROUTER_API_KEY; 
const apiUrl = 'https://openrouter.ai/api/v1/chat/completions'; 

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// This array keeps track of your conversation history so the AI remembers context
let conversationHistory = [
  { 
    role: 'system', 
    content: 'You are Grocery-AI, an expert culinary assistant and shopping list organizer. Your job is to help users with budget-friendly meal planning, recipe development, grocery lists, and kitchen inventory management. Keep answers practical, structured, and helpful.' 
  }
];

function askAI() {
  rl.question('\nYou: ', (userInput) => {
    if (userInput.toLowerCase() === 'exit') {
      rl.close();
      return;
    }

    console.log('Grocery-AI is thinking...');

    conversationHistory.push({ role: 'user', content: userInput });

    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'nvidia/nemotron-3-super-120b-a12b:free', 
        messages: conversationHistory 
      })
    })
    .then(async response => {
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      return response.json();
    })
    .then(data => {
      const aiReply = data.choices[0].message.content; 
      
      console.log(`\nGrocery-AI: ${aiReply}`);
      
      conversationHistory.push({ role: 'assistant', content: aiReply });

      askAI(); 
    })
    .catch(error => {
      console.error('\nError fetching data:', error.message);
      askAI(); 
    });
  });
}

console.log("Grocery-AI is online! Ask for a recipe or shopping list setup. (Type 'exit' to quit)");
askAI();