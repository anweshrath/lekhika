const { kv } = require('@vercel/kv');

const CONFIG_KEY = 'lekhikaAppConfig';

module.exports = async function handler(request, response) {
  console.log(`[API Config] Received ${request.method} request.`);

  // Check for KV environment variables to ensure it's connected.
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    console.error("[API Config ERROR] Vercel KV environment variables not found. Returning 500.");
    return response.status(500).json({ error: 'Server configuration error: KV database not connected. Please connect a KV store in your Vercel project settings.' });
  }

  // --- Handle POST request (from admin panel to save config) ---
  if (request.method === 'POST') {
    const adminSecret = process.env.ADMIN_SECRET_KEY;
    const authHeader = request.headers['authorization'];
    const receivedAuthToken = authHeader ? authHeader.split(' ')[1] : 'No Token';

    console.log(`[API Config POST] AdminSecret from env: ${adminSecret ? 'SET' : 'NOT SET'}, Received Auth Header: ${receivedAuthToken}`);
// Add these 3 lines
console.log('[API Config POST] receivedAuthToken:', authHeader);
console.log('[API Config POST] process.env.ADMIN_SECRET:', process.env.ADMIN_SECRET);
console.log('[API Config POST] Comparison:', authHeader === 'Bearer ' + process.env.ADMIN_SECRET);

if (adminSecret) { // This line is already there, don't change it
    if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
      console.error(`[API Config POST ERROR] Unauthorized access attempt. Expected: Bearer ${adminSecret}, Received: ${authHeader}.`);
      return response.status(401).json({ error: 'Unauthorized: Admin Secret Key mismatch or missing.' });
    }

    try {
      const configData = request.body;
      console.log("[API Config POST] Attempting to save config to KV:", JSON.stringify(configData, null, 2));
      await kv.set(CONFIG_KEY, configData);
      console.log("[API Config POST SUCCESS] Configuration saved successfully to KV.");
      return response.status(200).json({ message: 'Configuration saved successfully.' });
    } catch (error) {
      console.error('[API Config POST ERROR] Error SAVING configuration to KV:', error.message, error.stack);
      return response.status(500).json({ error: `Failed to save configuration to database. Server log: ${error.message}` });
    }
  }

  // --- Handle GET request (from Lekhika tool to load config) ---
  if (request.method === 'GET') {
    console.log("[API Config GET] Attempting to fetch config from KV.");
    try {
      const fullConfig = await kv.get(CONFIG_KEY);
      console.log("[API Config GET] Fetched raw config from KV:", fullConfig ? 'Data Found' : 'No Data');
      
      if (!fullConfig) {
        console.warn("[API Config GET WARNING] Configuration not found in KV. Returning 404.");
        return response.status(404).json({ error: 'Configuration not found. Please save settings in the admin panel first.' });
      }

      // Sanitize config by removing API keys before sending to client
      const sanitizedConfig = {
        model: fullConfig.model,
        ui: fullConfig.ui,
        prompting: fullConfig.prompting
      };
      console.log("[API Config GET SUCCESS] Sending sanitized config to client.");
      return response.status(200).json(sanitizedConfig);
    } catch (error) {
      console.error('[API Config GET ERROR] Error FETCHING configuration from KV:', error.message, error.stack);
      return response.status(500).json({ error: `Failed to fetch configuration from database. Server log: ${error.message}` });
    }
  }

  response.setHeader('Allow', ['GET', 'POST']);
  response.status(405).end(`Method ${request.method} Not Allowed`);
}
