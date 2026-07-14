const severityRank = { critical: 4, high: 3, medium: 2, low: 1 };

export const getWeakTopicSeverity = ({ score = 0, attempts = 1 }) => {
  if (attempts >= 4 || score < 30) return 'critical';
  if (attempts >= 3 || score < 50) return 'high';
  if (attempts >= 2 || score < 70) return 'medium';
  return 'low';
};

export const getNextLessonFromCourse = (course) => {
  if (!course) return null;
  return course.modules.flatMap((module) => module.lessons).find((item) => item.status !== 'completed')?.lesson || null;
};

export const buildLearningRecommendations = ({ course, progress, dueRevisions = [] }) => {
  if (!course || !progress) return [];
  const recommendations = [];
  const sortedWeakTopics = [...(progress.weakTopics || [])].sort((a, b) => (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0));
  const topWeakTopic = sortedWeakTopics[0];
  const nextLesson = getNextLessonFromCourse(course);

  if (dueRevisions.length) {
    recommendations.push({
      type: 'revision',
      priority: dueRevisions[0].priority || 'high',
      title: 'Complete today’s revision',
      description: `Revise ${dueRevisions[0].topic} before moving ahead. This keeps weak topics from repeating.`,
      actionLabel: 'Open progress',
      actionPath: '/progress'
    });
  }

  if (topWeakTopic) {
    recommendations.push({
      type: 'weak_topic',
      priority: topWeakTopic.severity || 'medium',
      title: `Fix ${topWeakTopic.topic}`,
      description: `This topic appeared ${topWeakTopic.attempts || 1} time(s) from ${topWeakTopic.source}. Ask AI for a simple explanation or retake related quiz questions.`,
      actionLabel: 'Ask AI mentor',
      actionPath: '/mentor'
    });
  }

  if ((progress.quizStats?.averageScore || 0) < 60 && progress.quizStats?.totalAttempts > 0) {
    recommendations.push({
      type: 'quiz_practice',
      priority: 'high',
      title: 'Improve quiz accuracy',
      description: 'Your average quiz score is below 60%. Review wrong answers before unlocking tougher practice.',
      actionLabel: 'View progress',
      actionPath: '/progress'
    });
  }

  if (nextLesson) {
    recommendations.push({
      type: 'next_lesson',
      priority: 'medium',
      title: 'Continue next lesson',
      description: `Continue with ${nextLesson.title}. Keep momentum by completing one lesson and one quiz block today.`,
      actionLabel: 'Continue learning',
      actionPath: `/lessons/${nextLesson._id}`
    });
  }

  if (!recommendations.length) {
    recommendations.push({
      type: 'healthy_progress',
      priority: 'low',
      title: 'Keep your current pace',
      description: 'No critical weak topic detected yet. Complete the next lesson and take a quiz to generate deeper insights.',
      actionLabel: 'View roadmap',
      actionPath: '/roadmap'
    });
  }

  return recommendations.slice(0, 4);
};

export const buildStudyPlan = ({ nextLesson, dueRevisions = [], progress }) => {
  const items = [];
  if (nextLesson) items.push({ label: 'Learn', title: nextLesson.title, minutes: 35, path: `/lessons/${nextLesson._id}` });
  dueRevisions.slice(0, 2).forEach((item) => items.push({ label: 'Revise', title: item.topic, minutes: item.priority === 'critical' ? 25 : 15, path: '/progress' }));
  if ((progress?.quizStats?.totalAttempts || 0) > 0) items.push({ label: 'Practice', title: 'Review your last quiz mistakes', minutes: 20, path: '/progress' });
  return items.slice(0, 4);
};
