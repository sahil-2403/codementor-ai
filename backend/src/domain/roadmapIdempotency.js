import crypto from 'crypto';

const normalizeRoadmapPayload = (payload = {}) => ({
  learningGoalId: payload.learningGoalId?.toString?.() || String(payload.learningGoalId || ''),
  assessmentId: payload.assessmentId?.toString?.() || String(payload.assessmentId || ''),
  roadmapType: payload.roadmapType || '',
  generatedReason: payload.generatedReason || ''
});

export const createRoadmapIdempotencyKey = (payload) => crypto
  .createHash('sha256')
  .update(JSON.stringify(normalizeRoadmapPayload(payload)))
  .digest('hex');
