import { Router, Request, Response } from 'express';
import { getDatabase } from '../../database/index.js';
import { ApiResponse } from '../../common/utils/api-response.js';

const router = Router();

router.get('/health', async (_req: Request, res: Response) => {
  let dbStatus = 'disconnected';
  try {
    const db = getDatabase();
    await db.raw('SELECT 1');
    dbStatus = 'connected';
  } catch (err: any) {
    dbStatus = `error: ${err.message}`;
  }

  const memoryUsage = process.memoryUsage();

  return ApiResponse.success(res, {
    status: dbStatus === 'connected' ? 'ok' : 'degraded',
    appName: 'Liton Brothers API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: dbStatus,
    memory: {
      rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotalMb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
    },
  });
});

export default router;
