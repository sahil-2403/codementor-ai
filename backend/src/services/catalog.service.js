import { Technology } from '../models/Technology.js';
import { Course } from '../models/Course.js';
import { LearningPath } from '../models/LearningPath.js';

const publishedFilter = { status: 'published' };

export const getPublishedCatalog = async () => {
  const [technologies, courses, learningPaths] = await Promise.all([
    Technology.find(publishedFilter)
      .populate('parentTechnology', 'name slug type')
      .sort({ order: 1, name: 1 })
      .lean(),
    Course.find(publishedFilter)
      .populate('technologies', 'name slug type iconKey')
      .populate('primaryTechnology', 'name slug type iconKey')
      .populate('recommendedPrerequisites', 'title slug category')
      .sort({ featured: -1, order: 1, title: 1 })
      .lean(),
    LearningPath.find(publishedFilter)
      .populate('technologies', 'name slug type iconKey')
      .populate({
        path: 'courses.course',
        match: { status: 'published' },
        select: 'title slug description category technologies primaryTechnology availableLevels status'
      })
      .sort({ featured: -1, order: 1, title: 1 })
      .lean()
  ]);

  const visiblePaths = learningPaths.map((path) => ({
    ...path,
    courses: (path.courses || []).filter((item) => Boolean(item.course)).sort((a, b) => a.order - b.order)
  }));

  return { technologies, courses, learningPaths: visiblePaths };
};
