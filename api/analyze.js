const { kv } = require('@vercel/kv');

const CONFIG_KEY = 'lekhikaAppConfig';

module.exports = async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const config = await kv.get(CONFIG_KEY);

    if (!config) {
      return response.status(500).json({ error: 'Configuration not found on server.' });
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
        body = { contents: [{ parts: [{ text: systemPrompt }, { text: `Here is the user's text to analyze:\n\n${text}` }] }] };
    } else {
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
        const errorData = await aiResponse.json();
        console.error(`AI API Error from ${provider}:`, errorData);
        throw new Error(`Failed to get response from ${provider}.`);
    }

    const data = await aiResponse.json();
    const jsonString = provider === 'gemini' ? data.candidates[0].content.parts[0].text : data.choices[0].message.content;
    
    return response.status(200).json(JSON.parse(jsonString));

  } catch (error) {
    console.error('Analysis Error:', error);
    return response.status(500).json({ error: error.message });
  }
}
