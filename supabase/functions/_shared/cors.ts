// Shared CORS headers for Supabase Edge Functions.
//
// Usage inside a function:
//   import { corsHeaders } from '../_shared/cors.ts';
//   if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
//   return new Response(JSON.stringify(data), {
//     headers: { ...corsHeaders, 'Content-Type': 'application/json' },
//   });
//
// Tighten `Access-Control-Allow-Origin` to your app's domain in production.
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};
