import Groq from 'groq-sdk';
import { getConfig } from '../config/env';
import { FaqQuestion, SessionQuestion } from '../types';
import * as faqRepository from '../repositories/faqRepository';
import { logger } from '../middleware/requestLogger';
import { NotFoundError } from '../middleware/errorHandler';

let groqClient: Groq;

function getGroq(): Groq {
  if (!groqClient) {
    groqClient = new Groq({ apiKey: getConfig().GROQ_API_KEY });
  }
  return groqClient;
}

export async function selectAndRephraseQuestions(
  domainId: string,
  count: number = 3
): Promise<SessionQuestion[]> {
  const domain = faqRepository.getDomain(domainId);
  if (!domain) {
    throw new NotFoundError(`Domain not found: ${domainId}`);
  }

  const selected = faqRepository.getRandomQuestions(domainId, count);

  if (selected.length === 0) {
    throw new NotFoundError(`No questions available for domain: ${domainId}`);
  }

  const rephrasedQuestions: SessionQuestion[] = [];

  for (const faq of selected) {
    try {
      const rephrased = await rephraseQuestion(faq);
      rephrasedQuestions.push({
        faqQuestionId: faq.id,
        rephrasedText: rephrased,
      });
    } catch (err) {
      logger.warn(
        { err, questionId: faq.id },
        'Failed to rephrase question, using original'
      );
      rephrasedQuestions.push({
        faqQuestionId: faq.id,
        rephrasedText: faq.question,
      });
    }
  }

  return rephrasedQuestions;
}

async function rephraseQuestion(faq: FaqQuestion): Promise<string> {
  const groq = getGroq();

  const completion = await groq.chat.completions.create({
    model: 'qwen/qwen3.6-27b',
    messages: [
      {
        role: 'system',
        content: `You are a professional interviewer. Rephrase the following interview question 
into a natural, conversational interview phrasing. Keep the core intent identical. 
Return ONLY the rephrased question — no preamble, no explanation, no quotation marks.`,
      },
      {
        role: 'user',
        content: faq.question,
      },
    ],
    temperature: 0.7,
    max_tokens: 200,
  });

  const raw = completion.choices[0]?.message?.content?.trim() || '';
  // Strip Qwen3 thinking tags
  const rephrased = raw.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

  if (!rephrased) {
    logger.warn({ questionId: faq.id }, 'Empty rephrase result, using original');
    return faq.question;
  }

  return rephrased;
}
