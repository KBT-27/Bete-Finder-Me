// @ts-ignore
import serverApp from '../dist/server.mjs';

export default function handler(req: any, res: any) {
  try {
    const origin = req.headers.origin;
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      res.statusCode = 200;
      return res.end();
    }

    const forwarded = req.headers['x-forwarded-uri'] || req.headers['x-matched-path'] || req.headers['x-now-route-matches'];
    if (forwarded && typeof forwarded === 'string' && (req.url === '/api/index' || req.url === '/api/index.ts' || req.url?.startsWith('/api/index'))) {
      req.url = forwarded;
    }

    return serverApp(req, res);
  } catch (error: any) {
    console.error('[Vercel Serverless Invocation Error]:', error);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        success: false,
        message: error?.message || 'Serverless function invocation error',
        error: String(error)
      }));
    }
  }
}