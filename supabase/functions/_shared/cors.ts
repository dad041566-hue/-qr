const ALLOWED_ORIGINS = [
  'https://tableflow.com',
  'https://www.tableflow.com',
  'https://tabledotflow.com',
  'https://www.tabledotflow.com',
]

export function getAllowedOrigin(req: Request): string {
  const origin = req.headers.get('origin') ?? ''
  const isDev = Deno.env.get('ENVIRONMENT') === 'development'
  if (isDev && origin.startsWith('http://localhost:')) return origin
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
}

export function corsHeaders(req: Request, methods = 'GET, POST, OPTIONS'): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': getAllowedOrigin(req),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': methods,
  }
}
