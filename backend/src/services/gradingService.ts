import Groq from 'groq-sdk';
import { getConfig } from '../config/env';
import { FaqQuestion, ContentGrading, ConfidenceBand } from '../types';
import { logger } from '../middleware/requestLogger';

let groqClient: Groq;

function getGroq(): Groq {
  if (!groqClient) {
    groqClient = new Groq({ apiKey: getConfig().GROQ_API_KEY });
  }
  return groqClient;
}

export async function gradeAnswer(
  transcript: string,
  faqEntry: FaqQuestion
): Promise<ContentGrading> {
  const groq = getGroq();

  const prompt = `You are an expert interview evaluator. Grade the candidate's answer against the ideal answer and key points.

**Interview Question:** ${faqEntry.question}

**Ideal Answer:** ${faqEntry.ideal_answer}

**Key Points Expected:**
${faqEntry.key_points.map((kp, i) => `${i + 1}. ${kp}`).join('\n')}

**Candidate's Answer (transcribed from speech):** ${transcript}

**Instructions:**
1. Identify which key points the candidate covered (even if phrased differently).
2. Identify which key points were missed.
3. CRITICAL STRICTNESS RULES:
   - If the candidate's answer is extremely short, vague, or says "I don't know", "I am not sure", or similar variants, you MUST assign a "developing" band and return 0 key points covered.
   - Do not give them the benefit of the doubt if they completely missed the core technical or behavioral meaning.
4. Assign a band: "developing" (missed most key points, unclear understanding, or "I don't know"), "comfortable" (covered several key points, reasonable understanding), or "strong" (covered most/all key points, demonstrated deep understanding).
5. Provide brief reasoning (2-3 sentences) explaining specifically what they lacked or did well.

**Respond in this exact JSON format:**
{
  "band": "developing" | "comfortable" | "strong",
  "keyPointsCovered": ["point1", "point2"],
  "keyPointsMissed": ["point3"],
  "reasoning": "Brief explanation"
}

Return ONLY valid JSON, no markdown fences, no preamble.`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-4-scout',
      messages: [
        { role: 'system', content: 'You are a precise JSON-outputting interview evaluator. Output only valid JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || '';

    // Parse JSON response — strip any markdown fences if present
    const jsonStr = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    const parsed = JSON.parse(jsonStr);

    const validBands: ConfidenceBand[] = ['developing', 'comfortable', 'strong'];
    const band: ConfidenceBand = validBands.includes(parsed.band) ? parsed.band : 'developing';

    return {
      band,
      keyPointsCovered: Array.isArray(parsed.keyPointsCovered) ? parsed.keyPointsCovered : [],
      keyPointsMissed: Array.isArray(parsed.keyPointsMissed) ? parsed.keyPointsMissed : faqEntry.key_points,
      reasoning: typeof parsed.reasoning === 'string' ? parsed.reasoning : 'Unable to parse grading response.',
    };
  } catch (err) {
    logger.error({ err, questionId: faqEntry.id }, 'Grading LLM call failed');

    // Fallback grading
    return {
      band: 'developing',
      keyPointsCovered: [],
      keyPointsMissed: faqEntry.key_points,
      reasoning: 'Grading service encountered an error. Please review manually.',
    };
  }
}
