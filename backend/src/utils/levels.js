export const LEVELS = ['beginner', 'intermediate', 'advanced'];

export const levelsThrough = (level) => {
  const index = LEVELS.indexOf(level);
  return index < 0 ? ['beginner'] : LEVELS.slice(0, index + 1);
};

export const isLevelAccessible = (learnerLevel, contentLevel) =>
  levelsThrough(learnerLevel).includes(contentLevel);

export const nextAvailableLevel = (currentLevel, availableLevels = []) => {
  const currentIndex = LEVELS.indexOf(currentLevel);
  if (currentIndex < 0) return null;
  return LEVELS.slice(currentIndex + 1).find((level) => availableLevels.includes(level)) || null;
};
