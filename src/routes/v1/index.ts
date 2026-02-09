import { Router, IRouter } from 'express';
import translateRoutes from './translate.routes';
import analyzeToneRoutes from './analyze-tone.routes';
import generateResponseRoutes from './generate-response.routes';
import processRoutes from './process.routes';
import healthRoutes from './health.routes';
import apiKeysRoutes from './api-keys.routes';
import languagesRoutes from './languages.routes';
import metricsRoutes from './metrics.routes';
import monitoringRoutes from './monitoring.routes';
import pricingRoutes from './pricing.routes';
import docsRoutes from './docs.routes';
import debugRoutes from './debug.routes';

const router: IRouter = Router();

// Mount all v1 routes
router.use('/translate', translateRoutes);
router.use('/analyze-tone', analyzeToneRoutes);
router.use('/generate-response', generateResponseRoutes);
router.use('/process', processRoutes);
router.use('/health', healthRoutes);
router.use('/api-keys', apiKeysRoutes);
router.use('/languages', languagesRoutes);
router.use('/metrics', metricsRoutes);
router.use('/monitoring', monitoringRoutes);
router.use('/pricing', pricingRoutes);
router.use('/debug', debugRoutes);
router.use('/', docsRoutes); // Documentation routes

export default router;
