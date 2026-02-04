import { Router, Request, Response, IRouter } from 'express';;
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import yaml from 'js-yaml';
import swaggerDefinition from '../../config/swagger.config';

const router: IRouter = Router();

// Swagger JSDoc options
const swaggerOptions: swaggerJsdoc.Options = {
  definition: swaggerDefinition,
  apis: [
    './src/routes/v1/*.ts',
    './src/controllers/*.ts',
    './src/middleware/*.ts',
  ],
};

// Generate OpenAPI specification
const swaggerSpec = swaggerJsdoc(swaggerOptions);

/**
 * GET /api/v1/docs
 * Swagger UI documentation
 */
router.use('/docs', swaggerUi.serve);
router.get('/docs', swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Y TU API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true,
  },
}));

/**
 * GET /api/v1/docs/json
 * OpenAPI specification in JSON format
 */
router.get('/docs/json', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

/**
 * GET /api/v1/docs/yaml
 * OpenAPI specification in YAML format
 */
router.get('/docs/yaml', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/yaml');
  res.send(yaml.dump(swaggerSpec));
});

/**
 * GET /api/v1/docs/openapi.json
 * Alternative endpoint for OpenAPI JSON (RapidAPI compatible)
 */
router.get('/openapi.json', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

/**
 * GET /api/v1/docs/openapi.yaml
 * Alternative endpoint for OpenAPI YAML (RapidAPI compatible)
 */
router.get('/openapi.yaml', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/yaml');
  res.send(yaml.dump(swaggerSpec));
});

export default router;
