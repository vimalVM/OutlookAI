import * as fs from 'fs';
import * as path from 'path';
import { FaqDomain, FaqQuestion, DomainInfo } from '../types';
import { logger } from '../middleware/requestLogger';

let domains: Map<string, FaqDomain> = new Map();

export function loadFaqs(): void {
  const faqDir = path.join(process.cwd(), 'data', 'faqs');

  if (!fs.existsSync(faqDir)) {
    logger.warn(`FAQ directory not found: ${faqDir}`);
    return;
  }

  const files = fs.readdirSync(faqDir).filter((f) => f.endsWith('.json'));

  for (const file of files) {
    try {
      const filePath = path.join(faqDir, file);
      const raw = fs.readFileSync(filePath, 'utf-8');
      const data: FaqDomain = JSON.parse(raw);

      // Use filename (without extension) as the domain ID
      const domainId = path.basename(file, '.json');
      domains.set(domainId, data);

      logger.info(
        { domainId, questionCount: data.questions.length },
        `Loaded FAQ domain: ${data.domain}`
      );
    } catch (err) {
      logger.error({ err, file }, `Failed to load FAQ file: ${file}`);
    }
  }

  logger.info({ totalDomains: domains.size }, 'All FAQ domains loaded');
}

export function getAllDomains(): DomainInfo[] {
  return Array.from(domains.entries()).map(([id, domain]) => ({
    id,
    domain: domain.domain,
    type: domain.type,
    questionCount: domain.questions.length,
  }));
}

export function getDomain(domainId: string): FaqDomain | undefined {
  return domains.get(domainId);
}

export function getQuestion(domainId: string, questionId: string): FaqQuestion | undefined {
  const domain = domains.get(domainId);
  if (!domain) return undefined;
  return domain.questions.find((q) => q.id === questionId);
}

export function getRandomQuestions(domainId: string, count: number): FaqQuestion[] {
  const domain = domains.get(domainId);
  if (!domain) return [];

  const shuffled = [...domain.questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

// For testing — reset loaded data
export function _resetForTesting(): void {
  domains = new Map();
}
