export const buildRoadmapPrompt = ({ template, goal, assessment }) => ({
  instruction: 'Personalize the roadmap using only provided lesson slugs and module structure.',
  template,
  goal,
  assessment
});
