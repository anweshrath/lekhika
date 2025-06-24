const { kv } = require('@vercel/kv');

const CONFIG_KEY = 'lekhikaAppConfig';

module.exports = async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const config = await kv.get(CONFIG_KEY);

        if (!config) {
            // This error implies KV is connected but no config has been saved yet via admin panel.
            // Or the CONFIG_KEY is wrong.
            return response.status(500).json({ error: 'Configuration not found on server. Please save settings in the admin panel.' });
        }

        const { text, provider } = request.body;
        if (!text || !provider) {
            return response.status(400).json({ error: 'Missing text or provider in request.' });
        }

        const apiKey = provider === 'gemini' ? config.api.geminiKey : config.api.openAiKey;
        const systemPrompt = provider === 'gemini' ? config.prompting.geminiSystemPrompt : config.prompting.openAiSystemPrompt;
        const modelVersion = provider === 'gemini' ? config.model.geminiModelVersion : config.model.openAiModelVersion;

        if (!apiKey) {
            return response.status(500).json({ error: `API key for ${provider} is not configured.`});
        }

        let url, body;
        const headers = { 'Content-Type': 'application/json' };

        if (provider === 'gemini') {
            url = `https://generativelanguage.googleapis.com/v1beta/models/${modelVersion}:generateContent?key=${apiKey}`;
            body = {
                contents: [{ parts: [{ text: systemPrompt }, { text: `Here is the user's text to analyze:\n\n${text}` }] }],
                // Instruct Gemini to return JSON
                generationConfig: {
                    responseMimeType: "application/json"
                }
            };
        } else { // OpenAI
            url = 'https://api.openai.com/v1/chat/completions';
            headers['Authorization'] = `Bearer ${apiKey}`;
            body = {
                model: modelVersion,
                messages: [ { "role": "system", "content": systemPrompt }, { "role": "user", "content": text } ],
                response_format: { "type": "json_object" }
            };
        }

        const aiResponse = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });

        if (!aiResponse.ok) {
            const errorData = await aiResponse.json().catch(() => ({ message: 'Could not parse error response.' })); // Safely parse error
            console.error(`AI API Error from ${provider}:`, errorData);
            throw new Error(`Failed to get response from ${provider}. ${errorData.message || ''} (Status: ${aiResponse.status})`);
        }

        const data = await aiResponse.json();

        // Safely extract JSON string based on provider
        let jsonString;
        if (provider === 'gemini') {
            // Gemini will now return a JSON string directly because of responseMimeType
            jsonString = data.candidates[0]?.content?.parts[0]?.text;
        } else { // OpenAI
            jsonString = data.choices[0]?.message?.content;
        }

        if (!jsonString) {
            console.error(`AI response did not contain expected JSON string for ${provider}:`, data);
            throw new Error(`AI response structure invalid for ${provider}.`);
        }
        
        return response.status(200).json(JSON.parse(jsonString));

    } catch (error) {
        console.error('Analysis Error:', error);
        return response.status(500).json({ error: `Analysis Error: ${error.message}` });
    }
}
