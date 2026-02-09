import { Router, Request, Response } from 'express';
import { apiKeyStore } from '../../services/apiKeyStore.service';

const router = Router();

// Temporary debug endpoint - REMOVE BEFORE PRODUCTION
router.get('/keys', (req: Request, res: Response) => {
  const keys: any[] = [];
  
  // Access the private keys using type assertion
  const store = apiKeyStore as any;
  if (store.keys && store.keys instanceof Map) {
    for (const [key, apiKey] of store.keys.entries()) {
      keys.push({
        key: key,
        tier: apiKey.tier,
        name: apiKey.name
      });
    }
  }
  
  res.json({
    success: true,
    data: { keys }
  });
});

export default router;