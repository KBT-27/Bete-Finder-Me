import app from '../server';

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

    return app(req, res);
  } catch (error: any) {
    console.error('[Vercel Catch-All Serverless Invocation Error]:', error);
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
