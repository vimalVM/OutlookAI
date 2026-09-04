import { Router, Request, Response } from 'express';
import * as faqRepository from '../repositories/faqRepository';

const router = Router();

/**
 * GET /domains
 * Public — lists all available interview domains
 */
router.get('/', (_req: Request, res: Response) => {
  const domains = faqRepository.getAllDomains();
  res.json({ domains });
});

export default router;
