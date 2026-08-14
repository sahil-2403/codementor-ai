export const onboardingSteps = [
  { key: 'catalog', label: 'Course', helper: 'Choose a course or complete path' },
  { key: 'level', label: 'Level', helper: 'Choose your starting point' },
  { key: 'roadmap', label: 'Roadmap', helper: 'Create your learning plan' }
];

export const onboardingCopyByLevel = {
  beginner: {
    title: 'Beginner path',
    description: 'Start with the published foundation roadmap for your selected course.',
    badge: 'No assessment required'
  },
  intermediate: {
    title: 'Intermediate path',
    description: 'Use the standard roadmap or take an optional skill check to focus on gaps.',
    badge: 'Assessment optional'
  },
  advanced: {
    title: 'Advanced path',
    description: 'Use the advanced roadmap or take an optional skill check for more focused preparation.',
    badge: 'Diagnostic optional'
  }
};
