const { kv } = require('@vercel/kv');

const CONFIG_KEY = 'lekhikaAppConfig';

module.exports = async function handler(request, response) {
  console.log(`[API Analyze] Received ${request.method} request.`);

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    console.log("[API Analyze] Attempting to load config from KV for analysis.");
    const config = await kv.get(CONFIG_KEY);

    if (!config) {
      console.error("[API Analyze ERROR] Configuration not found in KV for analysis. Returning 500.");
      return response.status(500).json({ error: 'Configuration not found on server. Please save settings in the admin panel first.' });
    }
    console.log("[API Analyze] Configuration loaded from KV for analysis.");

    const { text, provider } = request.body;
    console.log(`[API Analyze] Analyzing text for provider: ${provider}, Text length: ${text.length}`);

    if (!text || !provider) {
        console.error("[API Analyze ERROR] Missing text or provider in request. Returning 400.");
        return response.status(400).json({ error: 'Missing text or provider in request.' });
    }

    const apiKey = provider === 'gemini' ? config.api.geminiKey : config.api.openAiKey;
    const systemPrompt = provider === 'gemini' ? config.prompting.geminiSystemPrompt : config.prompting.openAiSystemPrompt;
    const modelVersion = provider === 'gemini' ? config.model.geminiModelVersion : config.model.openAiModelVersion;

    console.log(`[API Analyze] Using model: ${modelVersion} from provider: ${provider}. API Key status: ${apiKey ? 'Found' : 'NOT FOUND'}`);

    if (!apiKey) {
        console.error(`[API Analyze ERROR] API key for ${provider} is not configured. Returning 500.`);
        return response.status(500).json({ error: `API key for ${provider} is not configured.`});
    }

    let url, body;
    const headers = { 'Content-Type': 'application/json' };

    if (provider === 'gemini') {
        url = `https://generativelanguage.googleapis.com/v1beta/models/${modelVersion}:generateContent?key=${apiKey}`;
        body = { contents: [{ parts: [{ text: systemPrompt }, { text: `Here is the user's text to analyze:\n\n${text}` }] }] };
        console.log("[API Analyze] Gemini API Request Body:", JSON.stringify(body, null, 2));
    } else {
        url = 'https://api.openai.com/v1/chat/completions';
        headers['Authorization'] = `Bearer ${apiKey}`;
        body = {
            model: modelVersion,
            messages: [ { "role": "system", "content": systemPrompt }, { "role": "user", "content": text } ],
            response_format: { "type": "json_object" } // Ensure JSON object format for OpenAI
        };
        console.log("[API Analyze] OpenAI API Request Body:", JSON.stringify(body, null, 2));
    }

    console.log(`[API Analyze] Making API call to ${provider} at URL: ${url}`);
    const aiResponse = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    console.log(`[API Analyze] Raw AI API Response Status: ${aiResponse.status} ${aiResponse.statusText}`);

    if (!aiResponse.ok) {
        const errorData = await aiResponse.json();
        console.error(`[API Analyze ERROR] AI API Error from ${provider}:`, JSON.stringify(errorData, null, 2));
        throw new Error(`Failed to get response from ${provider}. AI responded with: ${JSON.stringify(errorData)}`);
    }

    const data = await aiResponse.json();
    console.log(`[API Analyze] Full AI API Response JSON from ${provider}:`, JSON.stringify(data, null, 2));

    let jsonString;
    if (provider === 'gemini') {
        // Gemini might return text, which needs to be parsed as JSON.
        // Ensure the prompt guides Gemini to output strict JSON.
        jsonString = data.candidates && data.candidates.length > 0 &&
                     data.candidates[0].content && data.candidates[0].content.parts &&
                     data.candidates[0].content.parts.length > 0
                     ? data.candidates[0].content.parts[0].text
                     : null;
    } else { // OpenAI
        jsonString = data.choices && data.choices.length > 0 &&
                     data.choices[0].message && data.choices[0].message.content
                     ? data.choices[0].message.content
                     : null;
    }

    if (!jsonString) {
      console.error(`[API Analyze ERROR] No valid JSON string extracted from AI response for provider: ${provider}.`);
      throw new Error(`Could not extract analysis JSON from ${provider} response.`);
    }

    console.log(`[API Analyze] Extracted JSON String for parsing:`, jsonString);
    
    // Attempt to parse the JSON string. This is where NaN typically originates if the string isn't valid JSON.
    const parsedJson = JSON.parse(jsonString);
    console.log(`[API Analyze SUCCESS] Parsed AI Response JSON:`, JSON.stringify(parsedJson, null, 2));
    
    // Return the parsed JSON directly
    return response.status(200).json(parsedJson);

  } catch (error) {
    console.error('[API Analyze CATCH ERROR]:', error.message, error.stack);
    return response.status(500).json({ error: error.message });
  }
}
