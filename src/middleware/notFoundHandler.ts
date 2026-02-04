import { Request, Response } from 'express';
import { getApiBasePath } from '../config/config';
import { sendNotFound, ErrorCode } from '../utils/response';

export const notFoundHandler = (req: Request, res: Response): void => {
  const apiBasePath = getApiBasePath();
  
  // Check if the request is for an API endpoint
  const isApiRequest = req.path.startsWith(apiBasePath) || req.path.startsWith('/api');
  
  const message = `Route ${req.method} ${req.path} not found`;
  const details = isApiRequest ? {
    suggestion: `Available API endpoints: ${apiBasePath}/health, ${apiBasePath}/translate, ${apiBasePath}/analyze-tone, ${apiBasePath}/generate-response, ${apiBasePath}/process`
  } : undefined;

  sendNotFound(req, res, message, ErrorCode.ENDPOINT_NOT_FOUND, details);
};