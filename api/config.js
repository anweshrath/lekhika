import { kv } from '@vercel/kv';

const CONFIG_KEY = 'lekhikaAppConfig';

export default async function handler(request, response) {
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
      console.error('Error saving configuration:', error);
      return response.status(500).json({ error: 'Failed to save configuration.' });
    }
  }

  // --- Handle GET request (from Lekhika tool to load config) ---
  if (request.method === 'GET') {
    try {
      const fullConfig = await kv.get(CONFIG_KEY);
      
      if (!fullConfig) {
        return response.status(404).json({ error: 'Configuration not found. Please save settings in the admin panel.' });
      }

      // IMPORTANT: Sanitize the config before sending to the client.
      // We NEVER send the secret API keys to the user's browser.
      const sanitizedConfig = {
        model: fullConfig.model,
        ui: fullConfig.ui,
        prompting: fullConfig.prompting 
      };

      return response.status(200).json(sanitizedConfig);
    } catch (error) {
      console.error('Error fetching configuration:', error);
      return response.status(500).json({ error: 'Failed to fetch configuration.' });
    }
  }

  // Handle other methods
  response.setHeader('Allow', ['GET', 'POST']);
  response.status(405).end(`Method ${request.method} Not Allowed`);
}
