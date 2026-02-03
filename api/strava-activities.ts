// @ts-nocheck
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Reusing credentials (in a real app, use env vars!)
const CLIENT_ID = '200015';
const CLIENT_SECRET = '8642f41e6fcb18d8d29c1dc3ba3ff6b7461215c9';

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ error: 'Missing userId' });
    }

    try {
        // 1. Get tokens from DB
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('strava_access_token, strava_refresh_token, strava_expires_at')
            .eq('id', userId)
            .single();

        if (error || !profile || !profile.strava_access_token) {
            return res.status(400).json({ error: 'User not connected to Strava' });
        }

        let accessToken = profile.strava_access_token;

        // 2. Check overlap/expiration (give 5 min buffer)
        const nowSeconds = Math.floor(Date.now() / 1000);
        if (profile.strava_expires_at && nowSeconds > (profile.strava_expires_at - 300)) {
            console.log('Token expired, refreshing...');
            // Refresh token
            const refreshParams = new URLSearchParams({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: 'refresh_token',
                refresh_token: profile.strava_refresh_token
            });

            const refreshRes = await fetch(`https://www.strava.com/oauth/token?${refreshParams}`, {
                method: 'POST'
            });
            const refreshData = await refreshRes.json();

            if (refreshData.access_token) {
                accessToken = refreshData.access_token;
                // Update DB
                await supabase.from('profiles').update({
                    strava_access_token: refreshData.access_token,
                    strava_refresh_token: refreshData.refresh_token,
                    strava_expires_at: refreshData.expires_at
                }).eq('id', userId);
            } else {
                throw new Error('Failed to refresh token');
            }
        }

        // 3. Fetch Activities (last 30 days)
        const after = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);
        const activitiesRes = await fetch(`https://www.strava.com/api/v3/athlete/activities?after=${after}&per_page=30`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        const activities = await activitiesRes.json();
        return res.status(200).json(activities);

    } catch (error: any) {
        console.error('API Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
