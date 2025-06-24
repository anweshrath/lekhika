const { kv } = require('@vercel/kv');

const CONFIG_KEY = 'lekhikaAppConfig';

module.exports = async function handler(request, response) {
  // Check for KV environment variables to ensure it's connected.
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    console.error("Vercel KV environment variables not found.");
    return response.status(500).json({ error: 'Server configuration error: KV database not connected. Please connect a KV store in your Vercel project settings.' });
  }
  
  // --- Handle POST request (from admin panel to save config) ---
  if (request.method === 'POST') {
    const adminSecret = process.env.ADMIN_SECRET_KEY;
    const authHeader = request.headers['authorization'];

    if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
      return response.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const configData = request.body;
      await kv.set(CONFIG_KEY, configData);
      return response.status(200).json({ message: 'Configuration saved successfully.' });
    } catch (error) {
      console.error('Error SAVING configuration to KV:', error);
      return response.status(500).json({ error: 'Failed to save configuration to database.' });
    }
  }

  // --- Handle GET request (from Lekhika tool to load config) ---
  if (request.method === 'GET') {
    try {
      const fullConfig = await kv.get(CONFIG_KEY);
      
      if (!fullConfig) {
        return response.status(404).json({ error: 'Configuration not found. Please save settings in the admin panel first.' });
      }

      const sanitizedConfig = {
        model: fullConfig.model,
        ui: fullConfig.ui,
        prompting: fullConfig.prompting 
      };

      return response.status(200).json(sanitizedConfig);
    } catch (error) {
      console.error('Error FETCHING configuration from KV:', error);
      // Send a more specific error message back to the frontend
      return response.status(500).json({ error: `Failed to fetch configuration from database. Server log: ${error.message}` });
    }
  }

  response.setHeader('Allow', ['GET', 'POST']);
  response.status(405).end(`Method ${request.method} Not Allowed`);
}
