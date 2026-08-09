export const TECHNOLOGY_TYPES = [
  ['language', 'Programming language'],
  ['framework', 'Framework'],
  ['runtime', 'Runtime'],
  ['database', 'Database'],
  ['library', 'Library'],
  ['platform', 'Platform'],
  ['tool', 'Tool']
];

export const COURSE_CATEGORIES = [
  ['fundamentals', 'Fundamentals'],
  ['frontend', 'Frontend'],
  ['backend', 'Backend'],
  ['fullstack', 'Full stack'],
  ['database', 'Database'],
  ['mobile', 'Mobile'],
  ['devops', 'DevOps'],
  ['data-ai', 'Data & AI'],
  ['interview', 'Interview preparation'],
  ['other', 'Other']
];

export const COURSE_LEVELS = ['beginner', 'intermediate', 'advanced'];

export const labelFor = (items, value) => items.find(([key]) => key === value)?.[1] || value;
