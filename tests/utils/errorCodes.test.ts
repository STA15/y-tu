import { ErrorCode, getErrorCodeFromStatus } from '../../src/utils/errorCodes';

describe('Error Codes', () => {
  describe('ErrorCode enum', () => {
    it('should have validation error codes', () => {
      expect(ErrorCode.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
      expect(ErrorCode.INVALID_INPUT).toBe('INVALID_INPUT');
      expect(ErrorCode.MISSING_REQUIRED_FIELD).toBe('MISSING_REQUIRED_FIELD');
    });

    it('should have authentication error codes', () => {
      expect(ErrorCode.UNAUTHORIZED).toBe('UNAUTHORIZED');
      expect(ErrorCode.INVALID_CREDENTIALS).toBe('INVALID_CREDENTIALS');
      expect(ErrorCode.API_KEY_INVALID).toBe('API_KEY_INVALID');
    });

    it('should have rate limiting error codes', () => {
      expect(ErrorCode.RATE_LIMIT_EXCEEDED).toBe('RATE_LIMIT_EXCEEDED');
      expect(ErrorCode.TOO_MANY_REQUESTS).toBe('TOO_MANY_REQUESTS');
    });
  });

  describe('getErrorCodeFromStatus', () => {
    it('should return correct error code for 400', () => {
      expect(getErrorCodeFromStatus(400)).toBe(ErrorCode.VALIDATION_ERROR);
    });

    it('should return correct error code for 401', () => {
      expect(getErrorCodeFromStatus(401)).toBe(ErrorCode.UNAUTHORIZED);
    });

    it('should return correct error code for 403', () => {
      expect(getErrorCodeFromStatus(403)).toBe(ErrorCode.FORBIDDEN);
    });

    it('should return correct error code for 404', () => {
      expect(getErrorCodeFromStatus(404)).toBe(ErrorCode.NOT_FOUND);
    });

    it('should return correct error code for 429', () => {
      expect(getErrorCodeFromStatus(429)).toBe(ErrorCode.RATE_LIMIT_EXCEEDED);
    });

    it('should return correct error code for 500', () => {
      expect(getErrorCodeFromStatus(500)).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
    });

    it('should return correct error code for 503', () => {
      expect(getErrorCodeFromStatus(503)).toBe(ErrorCode.SERVICE_UNAVAILABLE);
    });

    it('should return INTERNAL_SERVER_ERROR for unknown status codes', () => {
      expect(getErrorCodeFromStatus(999)).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
      expect(getErrorCodeFromStatus(200)).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
    });
  });
});
