import { getAdminFirestore } from '../config/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { SessionDocument, Attempt, SessionReport, ReportSummary } from '../types';
import { ForbiddenError, NotFoundError } from '../middleware/errorHandler';
import { logger } from '../middleware/requestLogger';

const COLLECTION = 'sessions';

function getCollection() {
  return getAdminFirestore().collection(COLLECTION);
}

export async function create(
  uid: string,
  sessionData: Omit<SessionDocument, 'uid'>
): Promise<string> {
  const docRef = getCollection().doc();
  const fullDoc: SessionDocument = {
    ...sessionData,
    uid,
  };

  await docRef.set(fullDoc);
  logger.info({ sessionId: docRef.id, uid }, 'Session created');
  return docRef.id;
}

export async function getById(sessionId: string, uid: string): Promise<SessionDocument & { id: string }> {
  const doc = await getCollection().doc(sessionId).get();

  if (!doc.exists) {
    throw new ForbiddenError('Access denied'); // Don't leak existence via 404
  }

  const data = doc.data() as SessionDocument;

  if (data.uid !== uid) {
    throw new ForbiddenError('Access denied'); // Ownership mismatch → 403
  }

  return { id: doc.id, ...data };
}

export async function appendAttempt(
  sessionId: string,
  uid: string,
  attempt: Attempt
): Promise<void> {
  // First verify ownership
  const session = await getById(sessionId, uid);

  const docRef = getCollection().doc(sessionId);
  const updatedAttempts = [...session.attempts, attempt];

  await docRef.update({ attempts: updatedAttempts });
  logger.info({ sessionId, uid, questionId: attempt.questionId }, 'Attempt appended');
}

export async function completeSession(
  sessionId: string,
  uid: string,
  report: SessionReport
): Promise<void> {
  // Verify ownership
  await getById(sessionId, uid);

  const docRef = getCollection().doc(sessionId);
  await docRef.update({
    status: 'completed',
    report,
    completedAt: FieldValue.serverTimestamp(),
  });

  logger.info({ sessionId, uid }, 'Session completed with report');
}

export async function setReport(
  sessionId: string,
  uid: string,
  report: SessionReport
): Promise<void> {
  await getById(sessionId, uid);

  const docRef = getCollection().doc(sessionId);
  await docRef.update({ report });
  logger.info({ sessionId, uid }, 'Report set');
}

export async function getCompletedByUser(uid: string): Promise<ReportSummary[]> {
  const snapshot = await getCollection()
    .where('uid', '==', uid)
    .where('status', '==', 'completed')
    .orderBy('completedAt', 'desc')
    .get();

  return snapshot.docs.map((doc: any) => {
    const data = doc.data() as SessionDocument;
    return {
      sessionId: doc.id,
      domainId: data.domainId,
      confidenceBand: data.report?.confidenceBand || 'developing',
      completedAt: data.completedAt
        ? (data.completedAt as any).toDate().toISOString()
        : new Date().toISOString(),
      questionCount: data.questions.length,
    };
  });
}

export async function updateAttempts(
  sessionId: string,
  uid: string,
  attempts: Attempt[]
): Promise<void> {
  await getById(sessionId, uid);

  const docRef = getCollection().doc(sessionId);
  await docRef.update({ attempts });
  logger.info({ sessionId, uid }, 'Attempts updated');
}
