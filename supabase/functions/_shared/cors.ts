// Standard CORS headers
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Allow requests from any origin (adjust in production)
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', // Ensure 'authorization' and 'content-type' are allowed
  'Access-Control-Allow-Methods': 'POST, GET, PUT, DELETE, OPTIONS', // Explicitly allow methods including OPTIONS
}
