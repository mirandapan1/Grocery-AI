require('dotenv').config();
const readline = require('readline');

const apiKey = process.env.OPENROUTER_API_KEY; 

const apiUrl = 'https://openrouter.ai/api/v1/chat/completions'; 
const modelName = 'openrouter/free';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

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
                // FIX 3: OpenRouter uses the standard Bearer Token scheme
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost', // Required by some OpenRouter configurations
                'X-Title': 'Grocery AI'
            },
            body: JSON.stringify({
                model: modelName, 
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
            if (data.choices && data.choices[0]) {
                // FIX 4: OpenRouter provides OpenAI-style JSON structures
                const aiReply = data.choices[0].message.content;
                console.log(`\nGrocery-AI: ${aiReply}`);
                conversationHistory.push({ role: 'assistant', content: aiReply });
            } else {
                console.log('\nError: Received unexpected data format from OpenRouter.');
            }
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
