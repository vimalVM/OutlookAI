import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authMiddleware } from '../../src/middleware/auth';
import { Request, Response } from 'express';
import { getAdminAuth } from '../../src/config/firebase';

vi.mock('../../src/config/firebase', () => ({
  getAdminAuth: vi.fn(),
}));

vi.mock('../../src/middleware/requestLogger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('AuthMiddleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let nextFunction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = {
      headers: {},
    };
    mockRes = {};
    nextFunction = vi.fn();
  });

  it('should call next with UnauthorizedError if Authorization header is missing', async () => {
    await authMiddleware(mockReq as Request, mockRes as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledTimes(1);
    const error = nextFunction.mock.calls[0][0];
    expect(error.statusCode).toBe(401);
    expect(error.message).toContain('Missing or malformed Authorization header');
  });

  it('should call next with UnauthorizedError if header is malformed', async () => {
    mockReq.headers = { authorization: 'Basic some-token' };

    await authMiddleware(mockReq as Request, mockRes as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledTimes(1);
    const error = nextFunction.mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });

  it('should call next with UnauthorizedError if token verification fails', async () => {
    mockReq.headers = { authorization: 'Bearer invalid-token' };

    const mockVerifyIdToken = vi.fn().mockRejectedValue(new Error('Token expired'));
    vi.mocked(getAdminAuth).mockReturnValue({
      verifyIdToken: mockVerifyIdToken,
    } as any);

    await authMiddleware(mockReq as Request, mockRes as Response, nextFunction);

    expect(mockVerifyIdToken).toHaveBeenCalledWith('invalid-token');
    expect(nextFunction).toHaveBeenCalledTimes(1);
    const error = nextFunction.mock.calls[0][0];
    expect(error.statusCode).toBe(401);
    expect(error.message).toContain('Invalid or expired token');
  });

  it('should attach uid to request and call next() on successful verification', async () => {
    mockReq.headers = { authorization: 'Bearer valid-token' };

    const mockVerifyIdToken = vi.fn().mockResolvedValue({ uid: 'user-123' });
    vi.mocked(getAdminAuth).mockReturnValue({
      verifyIdToken: mockVerifyIdToken,
    } as any);

    await authMiddleware(mockReq as Request, mockRes as Response, nextFunction);

    expect(mockVerifyIdToken).toHaveBeenCalledWith('valid-token');
    expect((mockReq as any).uid).toBe('user-123');
    expect(nextFunction).toHaveBeenCalledTimes(1);
    expect(nextFunction).toHaveBeenCalledWith(); // Called with no arguments (success)
  });
});
