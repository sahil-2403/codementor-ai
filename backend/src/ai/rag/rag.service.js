import { Lesson } from '../../models/Lesson.js';

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const extractKeywords = (query = '') => {
  const stopWords = new Set(['what', 'why', 'how', 'does', 'with', 'from', 'this', 'that', 'the', 'and', 'for', 'are', 'you', 'can', 'explain', 'give', 'tell', 'about', 'into', 'like', 'when', 'where']);
  return String(query)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word))
    .slice(0, 8);
};

const scoreLesson = (lesson, keywords) => {
  const haystack = [
    lesson.title,
    lesson.topic?.title,
    lesson.difficulty,
    ...(lesson.tags || []),
    lesson.theory,
    lesson.interviewDefinition,
    lesson.codeExplanation
  ].join(' ').toLowerCase();

  return keywords.reduce((score, keyword) => {
    if (String(lesson.title).toLowerCase().includes(keyword)) return score + 5;
    if ((lesson.tags || []).map((tag) => tag.toLowerCase()).includes(keyword)) return score + 4;
    if (String(lesson.topic?.title || '').toLowerCase().includes(keyword)) return score + 3;
    return score + (haystack.includes(keyword) ? 1 : 0);
  }, 0);
};

export const retrieveRelevantLearningContext = async ({ query, lessonId, maxResults = 3 }) => {
  const keywords = extractKeywords(query);
  const baseLessons = [];

  if (lessonId) {
    const currentLesson = await Lesson.findById(lessonId).populate('topic', 'title slug category difficulty');
    if (currentLesson) baseLessons.push(currentLesson);
  }

  if (!keywords.length) {
    return baseLessons.map((lesson) => ({
      lesson,
      score: 10,
      snippet: lesson.theory?.slice(0, 500) || lesson.interviewDefinition || '',
      source: { type: 'lesson', title: lesson.title, refId: lesson._id.toString() }
    }));
  }

  const regexes = keywords.map((word) => new RegExp(escapeRegex(word), 'i'));
  const candidateLessons = await Lesson.find({
    status: 'published',
    $or: [
      { title: { $in: regexes } },
      { theory: { $in: regexes } },
      { tags: { $in: regexes } },
      { interviewDefinition: { $in: regexes } },
      { codeExplanation: { $in: regexes } }
    ]
  })
    .populate('topic', 'title slug category difficulty')
    .limit(12);

  const merged = [...baseLessons, ...candidateLessons].filter((lesson, index, arr) => arr.findIndex((item) => item._id.toString() === lesson._id.toString()) === index);

  return merged
    .map((lesson) => ({
      lesson,
      score: lessonId && lesson._id.toString() === lessonId.toString() ? 99 : scoreLesson(lesson, keywords),
      snippet: [lesson.theory, lesson.codeExplanation, lesson.interviewDefinition].filter(Boolean).join('\n').slice(0, 700),
      source: { type: 'lesson', title: lesson.title, refId: lesson._id.toString() }
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
};
