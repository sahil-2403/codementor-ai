export const CONTENT_STATUS = Object.freeze({ DRAFT: 'draft', PUBLISHED: 'published', ARCHIVED: 'archived' });
export const COURSE_STATUS = Object.freeze({ ACTIVE: 'active', ARCHIVED: 'archived' });
export const LEARNING_ITEM_STATUS = Object.freeze({ LOCKED: 'locked', AVAILABLE: 'available', IN_PROGRESS: 'in_progress', COMPLETED: 'completed' });
export const REVIEW_STATUS = Object.freeze({ SUBMITTED: 'submitted', REVIEWING: 'reviewing', REVIEWED: 'reviewed', UNAVAILABLE: 'review_unavailable' });
export const REVIEW_MODE = Object.freeze({ AI: 'ai', FALLBACK: 'fallback', NONE: 'none' });
export const REVISION_STATUS = Object.freeze({ PENDING: 'pending', COMPLETED: 'completed', SKIPPED: 'skipped' });
export const SEVERITY = Object.freeze({ LOW: 'low', MEDIUM: 'medium', HIGH: 'high', CRITICAL: 'critical' });
export const ASSESSMENT_STATUS = Object.freeze({ NOT_REQUIRED: 'not_required', SKIPPED: 'skipped', COMPLETED: 'completed' });
export const ROADMAP_TYPE = Object.freeze({ TEMPLATE: 'template', ASSESSMENT_AI_PERSONALIZED: 'assessment_ai_personalized' });
export const ONBOARDING_STATE = Object.freeze({
  CATALOG_PENDING: 'catalog_pending', LEVEL_PENDING: 'level_pending',
  ASSESSMENT_CHOICE_PENDING: 'assessment_choice_pending', ASSESSMENT_IN_PROGRESS: 'assessment_in_progress',
  ASSESSMENT_COMPLETED: 'assessment_completed', ROADMAP_PENDING: 'roadmap_pending',
  ROADMAP_FAILED: 'roadmap_failed', COMPLETED: 'completed'
});
export const ROADMAP_SETUP_STATES = Object.freeze([ONBOARDING_STATE.ROADMAP_PENDING, ONBOARDING_STATE.ROADMAP_FAILED]);

const STATUS_TONE = Object.freeze({
  [CONTENT_STATUS.DRAFT]: 'warning', [CONTENT_STATUS.PUBLISHED]: 'success', [CONTENT_STATUS.ARCHIVED]: 'neutral',
  [COURSE_STATUS.ACTIVE]: 'success',
  [LEARNING_ITEM_STATUS.LOCKED]: 'neutral', [LEARNING_ITEM_STATUS.AVAILABLE]: 'info', [LEARNING_ITEM_STATUS.IN_PROGRESS]: 'warning', [LEARNING_ITEM_STATUS.COMPLETED]: 'success',
  [REVIEW_STATUS.SUBMITTED]: 'neutral', [REVIEW_STATUS.REVIEWING]: 'info', [REVIEW_STATUS.REVIEWED]: 'success', [REVIEW_STATUS.UNAVAILABLE]: 'warning',
  [REVISION_STATUS.PENDING]: 'warning', [REVISION_STATUS.SKIPPED]: 'neutral',
  [ASSESSMENT_STATUS.NOT_REQUIRED]: 'neutral', [SEVERITY.LOW]: 'neutral', [SEVERITY.MEDIUM]: 'info', [SEVERITY.HIGH]: 'warning', [SEVERITY.CRITICAL]: 'danger',
  success: 'success', blocked: 'warning', active: 'success', missing: 'warning'
});

export const getStatusTone = (status) => STATUS_TONE[String(status || '').toLowerCase()] || 'neutral';
export const formatDomainLabel = (value) => String(value || 'unknown').replaceAll('_', ' ');
