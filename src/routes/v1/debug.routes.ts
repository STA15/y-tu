import { Router, Request, Response } from 'express';
import { ApiKeyModel } from '../../models/apiKey.model.mongoose';

const router = Router();

// Temporary debug endpoint - REMOVE BEFORE PRODUCTION
router.get('/keys', async (req: Request, res: Response) => {
  try {
    // Get ALL keys from MongoDB (not just active ones)
    const allKeys = await ApiKeyModel.find({}).select('key name tier isActive').lean();
    
    res.json({
      success: true,
      data: { 
        keys: allKeys.map(k => ({
          key: k.key,
          name: k.name,
          tier: k.tier,
          isActive: k.isActive,
          keyLength: k.key?.length || 0
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch keys from database'
    });
  }
});

export default router;