import { QuizQuestion } from '../models/QuizQuestion.js';
import { Assessment } from '../models/Assessment.js';
import { LearningGoal } from '../models/LearningGoal.js';
import { ApiError } from '../utils/ApiError.js';
import { markAssessmentCompleted, markAssessmentStarted } from './onboarding.service.js';

const getRecommendedLevel = ({ requestedLevel, score }) => {
  if (score < 45) return requestedLevel === 'advanced' ? 'intermediate' : 'beginner';
  if (score >= 80 && requestedLevel === 'intermediate') return 'advanced-ready';
  return requestedLevel;
};

const getSuggestedRoadmapType = ({ weakTopics, score }) => {
  if (score < 50) return 'foundation_repair';
  if (weakTopics.length >= 3) return 'gap_focused';
  if (score >= 80) return 'accelerated';
  return 'balanced_personalized';
};

const normalizeIdSet = (ids = []) => ids.map((id) => id.toString()).sort();

export const getAssessmentQuestions = async ({ userId, learningGoalId, level }) => {
  const goal = await LearningGoal.findOne({ _id: learningGoalId, user: userId });
  if (!goal) throw new ApiError(404, 'Learning goal not found');
  if (goal.level !== level) throw new ApiError(400, 'Assessment level does not match the selected learning goal');
  if (level === 'beginner') throw new ApiError(400, 'Beginner learners do not need a diagnostic assessment');

  const recentSession = await Assessment.findOne({
    user: userId,
    learningGoal: learningGoalId,
    level,
    status: 'started',
    createdAt: { $gte: new Date(Date.now() - 2 * 60 * 60 * 1000) }
  }).populate({ path: 'questionIds', select: '-correctAnswer -explanation', populate: { path: 'topic', select: 'title category' } }).sort({ createdAt: -1 });

  if (recentSession?.questionIds?.length) {
    await markAssessmentStarted({ userId, learningGoalId });
    return { sessionId: recentSession._id, questions: recentSession.questionIds };
  }

  const questions = await QuizQuestion.find({
    bank: 'skill_check',
    difficulty: level,
    status: 'published'
  })
    .populate('topic', 'title category')
    .limit(12)
    .select('-correctAnswer -explanation')
    .lean();

  if (!questions.length) throw new ApiError(404, 'No skill-check questions found for this level');

  const session = await Assessment.create({
    user: userId,
    learningGoal: learningGoalId,
    level,
    status: 'started',
    questionIds: questions.map((question) => question._id),
    answers: [],
    categoryScores: [],
    weakTopics: [],
    strongTopics: [],
    score: 0
  });

  await markAssessmentStarted({ userId, learningGoalId });
  return { sessionId: session._id, questions };
};

export const submitAssessment = async ({ userId, learningGoalId, sessionId, answers }) => {
  const goal = await LearningGoal.findOne({ _id: learningGoalId, user: userId });
  if (!goal) throw new ApiError(404, 'Learning goal not found');

  const session = await Assessment.findOne({ _id: sessionId, user: userId, learningGoal: learningGoalId, status: 'started' });
  if (!session) throw new ApiError(404, 'Active assessment session not found. Start the assessment again.');

  const submittedIds = normalizeIdSet(answers.map((answer) => answer.questionId));
  const requiredIds = normalizeIdSet(session.questionIds || []);
  if (new Set(submittedIds).size !== submittedIds.length) throw new ApiError(400, 'Duplicate assessment question submitted');
  if (submittedIds.length !== requiredIds.length || submittedIds.some((id, index) => id !== requiredIds[index])) {
    throw new ApiError(400, 'Assessment answers must exactly match the started assessment questions');
  }

  const questions = await QuizQuestion.find({ _id: { $in: session.questionIds } }).populate('topic', 'title category');
  if (questions.length !== requiredIds.length) throw new ApiError(400, 'Some assessment questions are no longer available');
  if (questions.some((question) => question.difficulty !== goal.level)) throw new ApiError(400, 'Assessment question level mismatch');

  const answerMap = new Map(answers.map((answer) => [answer.questionId.toString(), answer.selectedAnswer]));

  const topicStats = new Map();
  const checkedAnswers = questions.map((question) => {
    const selectedAnswer = answerMap.get(question._id.toString()) || '';
    const isCorrect = selectedAnswer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
    const topicTitle = question.topic?.title || 'General';
    const current = topicStats.get(topicTitle) || { correct: 0, total: 0 };
    current.total += 1;
    if (isCorrect) current.correct += 1;
    topicStats.set(topicTitle, current);

    return { question: question._id, selectedAnswer, isCorrect, topicTitle };
  });

  const totalCorrect = checkedAnswers.filter((answer) => answer.isCorrect).length;
  const score = Math.round((totalCorrect / Math.max(checkedAnswers.length, 1)) * 100);

  const categoryScores = Array.from(topicStats.entries()).map(([topic, value]) => ({
    topic,
    score: Math.round((value.correct / value.total) * 100),
    total: value.total
  }));
  const weakTopics = categoryScores.filter((item) => item.score < 70).map((item) => ({ topic: item.topic, score: item.score }));
  const strongTopics = categoryScores.filter((item) => item.score >= 80).map((item) => ({ topic: item.topic, score: item.score }));

  session.status = 'completed';
  session.answers = checkedAnswers;
  session.categoryScores = categoryScores;
  session.weakTopics = weakTopics;
  session.strongTopics = strongTopics;
  session.score = score;
  session.completedAt = new Date();
  await session.save();

  await markAssessmentCompleted({ userId, learningGoalId });

  return {
    assessment: session,
    report: buildAssessmentReport(session)
  };
};

export const buildAssessmentReport = (assessment) => ({
  assessmentId: assessment._id,
  learningGoalId: assessment.learningGoal,
  score: assessment.score,
  level: assessment.level,
  categoryScores: assessment.categoryScores,
  weakTopics: assessment.weakTopics,
  strongTopics: assessment.strongTopics,
  recommendedLevel: getRecommendedLevel({ requestedLevel: assessment.level, score: assessment.score }),
  suggestedRoadmapType: getSuggestedRoadmapType({ weakTopics: assessment.weakTopics, score: assessment.score }),
  summary: assessment.weakTopics?.length
    ? `Your roadmap should focus on ${assessment.weakTopics.slice(0, 3).map((item) => item.topic).join(', ')}.`
    : 'Your assessment looks strong. You can move into a faster roadmap with project and interview practice.'
});

export const getAssessmentReport = async ({ userId, assessmentId }) => {
  const assessment = await Assessment.findOne({ _id: assessmentId, user: userId, status: 'completed' }).lean();
  if (!assessment) throw new ApiError(404, 'Assessment report not found');
  return buildAssessmentReport(assessment);
};
