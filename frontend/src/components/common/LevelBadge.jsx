import Badge from './Badge.jsx';

const levelVariants = {
  beginner: 'success',
  intermediate: 'warning',
  advanced: 'danger'
};

export default function LevelBadge({ level, className = '' }) {
  if (!level) return null;

  return (
    <Badge variant={levelVariants[level] || 'neutral'} className={`capitalize ${className}`}>
      {level}
    </Badge>
  );
}
