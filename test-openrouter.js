const fetch = require('node-fetch');
require('dotenv').config();

async function testOpenRouter() {
    console.log('Testing OpenRouter API...');
    console.log('API Key exists:', !!process.env.OPENROUTER_API_KEY);

    if (!process.env.OPENROUTER_API_KEY) {
        console.log('ERROR: OPENROUTER_API_KEY not set');
        return;
    }

    // Test with a simple text request first to verify API works
    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'meta-llama/llama-3.2-11b-vision-instruct:free',
                messages: [{
                    role: 'user',
                    content: [{ type: 'text', text: 'Hello, this is a test.' }]
                }],
                max_tokens: 50
            })
        });

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.log('Error:', error.message);
    }
}

testOpenRouter();