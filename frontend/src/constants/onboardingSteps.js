export const accountJourneySteps = [
  { key: 'account', label: 'Account' },
  { key: 'verify', label: 'Verify' },
  { key: 'goal', label: 'Goal' },
  { key: 'level', label: 'Level' },
  { key: 'roadmap', label: 'Roadmap' }
];

export const onboardingSteps = [
  { key: 'goal', label: 'Goal', helper: 'Choose your learning path' },
  { key: 'level', label: 'Level', helper: 'Set current ability' },
  { key: 'setup', label: 'Setup', helper: 'Preferences or diagnostic' },
  { key: 'roadmap', label: 'Roadmap', helper: 'Create your plan' }
];

export const onboardingCopyByLevel = {
  beginner: {
    title: 'Beginner path',
    description: 'No test. We start with fundamentals, then personalize pace from your preferences.',
    badge: 'No assessment required'
  },
  intermediate: {
    title: 'Intermediate path',
    description: 'Start quickly with a template, or take a diagnostic to detect weak topics before roadmap generation.',
    badge: 'Assessment optional'
  },
  advanced: {
    title: 'Advanced path',
    description: 'Use an advanced template immediately, or take a deeper diagnostic for targeted interview and architecture prep.',
    badge: 'Diagnostic optional'
  }
};
