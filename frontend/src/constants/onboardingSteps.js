export const onboardingSteps = [
  { key: 'catalog', label: 'Course', helper: 'Choose a course or complete path' },
  { key: 'level', label: 'Level', helper: 'Choose your starting point' },
  { key: 'setup', label: 'Setup', helper: 'Set your pace or check your skills' },
  { key: 'roadmap', label: 'Roadmap', helper: 'Create your learning plan' }
];

export const onboardingCopyByLevel = {
  beginner: {
    title: 'Beginner path',
    description: 'Start with the fundamentals and set a pace that fits your schedule.',
    badge: 'No assessment required'
  },
  intermediate: {
    title: 'Intermediate path',
    description: 'Start with the recommended roadmap or take an optional skill check to focus on gaps.',
    badge: 'Assessment optional'
  },
  advanced: {
    title: 'Advanced path',
    description: 'Start with an advanced roadmap or take an optional skill check for more focused preparation.',
    badge: 'Diagnostic optional'
  }
};
