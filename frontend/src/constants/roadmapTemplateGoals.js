export const ROADMAP_TEMPLATE_GOALS = [
  { key: 'junior-mern-stack', label: 'Junior MERN Stack Developer' }
];

export const getRoadmapTemplateGoalLabel = (goalKey) => (
  ROADMAP_TEMPLATE_GOALS.find((goal) => goal.key === goalKey)?.label || goalKey
);
