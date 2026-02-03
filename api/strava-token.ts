import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!;
// Note: We need the SERVICE_ROLE_KEY to update user profiles securely from the backend without user session constraints, 
// OR we can use the anon key if RLS allows the user to update their own profile.
// Since we are validating the user via the code exchange flow, let's try to stick to RLS if possible, 
// BUT token exchange happens server-side. 
// Actually, standard practice: FE sends code -> BE exchanges for token -> BE updates DB. 
// BE needs privilege or a user session. 
// Simplest for now: Return tokens to FE, FE saves to DB (secured by RLS). 
// BETTER SECURITY: BE saves to DB. 

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { code, clientId, clientSecret } = req.body;

    if (!code || !clientId || !clientSecret) {
        return res.status(400).json({ error: 'Missing parameters' });
    }

    try {
        const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                code: code,
                grant_type: 'authorization_code',
            }),
        });

        const data = await tokenResponse.json();

        if (data.errors) {
            return res.status(400).json({ error: data });
        }

        // Return the tokens to the client so it can save them to Supabase
        // (Or save them here if we had the Supabase Service Key env var set up)
        return res.status(200).json(data);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
}
