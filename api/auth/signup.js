/**
 * Vercel API: /api/auth/signup
 * Proxies signup requests to Supabase via backend
 */

const SUPABASE_URL = 'https://yjldccipruughgifgwws.supabase.co';
const SUPABASE_KEY = 'sb_publishable_jYKpCaLeJuiKoXBdKVcmBQ_e4xr9m9w';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    console.log(`[Auth Proxy] Signup attempt for: ${email}`);

    const response = await fetch(
      `${SUPABASE_URL}/auth/v1/signup`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password,
          options: {
            emailRedirectTo: `${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000'}/app`,
          },
        }),
      }
    );

    const data = await response.json();

    console.log(`[Auth Proxy] Signup response status: ${response.status}`);

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error_description || data.message || 'Signup failed',
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('[Auth Proxy] Error:', error.message);
    return res.status(500).json({
      error: 'Failed to connect to authentication service',
      details: error.message,
    });
  }
}
