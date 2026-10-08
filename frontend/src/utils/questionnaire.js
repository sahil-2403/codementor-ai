export const buildAnswerPayload = (questions = [], answers = {}) =>
  questions
    .map((question) => ({
      questionId: question._id,
      selectedAnswer: answers[question._id] || ''
    }))
    .filter((answer) => answer.selectedAnswer);

export const countAnsweredQuestions = (questions = [], answers = {}) =>
  questions.filter((question) => Boolean(answers[question._id])).length;
