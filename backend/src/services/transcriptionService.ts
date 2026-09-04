import Groq from 'groq-sdk';
import { getConfig } from '../config/env';
import { logger } from '../middleware/requestLogger';

let groqClient: Groq;

function getGroq(): Groq {
  if (!groqClient) {
    groqClient = new Groq({ apiKey: getConfig().GROQ_API_KEY });
  }
  return groqClient;
}

export async function transcribeAudio(audioBuffer: Buffer, mimeType: string = 'audio/webm'): Promise<string> {
  const groq = getGroq();

  logger.info({ audioSize: audioBuffer.length, mimeType }, 'Starting transcription');

  try {
    // Create a File-like object from the buffer
    const file = new File([audioBuffer as any], 'audio.webm', { type: mimeType });

    const transcription = await groq.audio.transcriptions.create({
      file: file,
      model: 'whisper-large-v3',
      language: 'en',
      response_format: 'text',
    });

    const transcript = typeof transcription === 'string'
      ? transcription
      : (transcription as any).text || '';

    logger.info(
      { transcriptLength: transcript.length },
      'Transcription completed'
    );

    return transcript.trim();
  } catch (err) {
    logger.error({ err }, 'Transcription failed');
    throw new Error('Failed to transcribe audio');
  }
}
