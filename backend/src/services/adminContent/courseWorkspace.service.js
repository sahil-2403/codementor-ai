import { Course } from '../../models/Course.js';
import { Topic } from '../../models/Topic.js';
import { Lesson } from '../../models/Lesson.js';
import { QuizQuestion } from '../../models/QuizQuestion.js';
import { InterviewQuestion } from '../../models/InterviewQuestion.js';
import { ProjectTask } from '../../models/ProjectTask.js';
import { RoadmapTemplate } from '../../models/RoadmapTemplate.js';
import { ensureFound } from './common.js';

const statusCounts = async (model, filter = {}) => {
  const rows = await model.aggregate([
    { $match: filter },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  return rows.reduce((result, row) => ({ ...result, [row._id]: row.count }), {});
};

const normalized = (counts, statuses) => ({
  total: statuses.reduce((sum, status) => sum + (counts[status] || 0), 0),
  ...Object.fromEntries(statuses.map((status) => [status, counts[status] || 0]))
});

export const getCourseWorkspace = async (courseId) => {
  const course = ensureFound(
    await Course.findById(courseId)
      .populate('technologies', 'name slug type iconKey status')
      .populate('primaryTechnology', 'name slug type iconKey status')
      .populate('recommendedPrerequisites', 'title slug status')
      .lean(),
    'Course'
  );

  const [
    topicsRaw,
    lessonsRaw,
    quizRaw,
    skillRaw,
    interviewRaw,
    projectsRaw,
    templatesRaw,
    templates
  ] = await Promise.all([
    statusCounts(Topic, { course: course._id }),
    statusCounts(Lesson, { course: course._id }),
    statusCounts(QuizQuestion, { course: course._id, bank: 'quiz' }),
    statusCounts(QuizQuestion, { course: course._id, bank: 'skill_check' }),
    statusCounts(InterviewQuestion, { course: course._id }),
    statusCounts(ProjectTask, { course: course._id }),
    statusCounts(RoadmapTemplate, { course: course._id }),
    RoadmapTemplate.find({ course: course._id }).select('_id level title status modules estimatedDurationDays').lean()
  ]);

  const templatesByLevel = new Map(templates.map((template) => [template.level, template]));
  const templateCoverage = Object.fromEntries((course.availableLevels || []).map((level) => {
    const template = templatesByLevel.get(level);
    return [level, template
      ? { status: template.status, templateId: template._id, title: template.title, modules: template.modules?.length || 0, estimatedDurationDays: template.estimatedDurationDays || 0 }
      : { status: 'missing', templateId: null, title: '', modules: 0, estimatedDurationDays: 0 }];
  }));

  return {
    course,
    counts: {
      topics: normalized(topicsRaw, ['active', 'archived']),
      lessons: normalized(lessonsRaw, ['draft', 'published', 'archived']),
      quizQuestions: normalized(quizRaw, ['draft', 'published', 'archived']),
      skillChecks: normalized(skillRaw, ['draft', 'published', 'archived']),
      interviewQuestions: normalized(interviewRaw, ['draft', 'published', 'archived']),
      projects: normalized(projectsRaw, ['draft', 'published', 'archived']),
      templates: normalized(templatesRaw, ['draft', 'published', 'archived'])
    },
    templateCoverage
  };
};
