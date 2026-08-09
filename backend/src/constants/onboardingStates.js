export const ONBOARDING_STATES = Object.freeze({
  CATALOG_PENDING: 'catalog_pending',
  LEVEL_PENDING: 'level_pending',
  PREFERENCES_PENDING: 'preferences_pending',
  ASSESSMENT_CHOICE_PENDING: 'assessment_choice_pending',
  ASSESSMENT_IN_PROGRESS: 'assessment_in_progress',
  ASSESSMENT_COMPLETED: 'assessment_completed',
  ROADMAP_PENDING: 'roadmap_pending',
  ROADMAP_GENERATING: 'roadmap_generating',
  ROADMAP_FAILED: 'roadmap_failed',
  COMPLETED: 'completed'
});

export const ONBOARDING_NEXT_PATH = Object.freeze({
  [ONBOARDING_STATES.CATALOG_PENDING]: '/onboarding/catalog',
  [ONBOARDING_STATES.LEVEL_PENDING]: '/onboarding/level',
  [ONBOARDING_STATES.PREFERENCES_PENDING]: '/onboarding/preferences',
  [ONBOARDING_STATES.ASSESSMENT_CHOICE_PENDING]: '/onboarding/assessment-intro',
  [ONBOARDING_STATES.ASSESSMENT_IN_PROGRESS]: '/onboarding/assessment',
  [ONBOARDING_STATES.ASSESSMENT_COMPLETED]: '/onboarding/assessment-report',
  [ONBOARDING_STATES.ROADMAP_PENDING]: '/onboarding/generating',
  [ONBOARDING_STATES.ROADMAP_GENERATING]: '/onboarding/generating',
  [ONBOARDING_STATES.ROADMAP_FAILED]: '/onboarding/generating',
  [ONBOARDING_STATES.COMPLETED]: '/dashboard'
});

export const isOnboardingState = (value) => Object.values(ONBOARDING_STATES).includes(value);
