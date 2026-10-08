import Select from '../common/Select.jsx';

export default function InterviewQuestionSelector({
  topics,
  currentTopic,
  topicQuestions,
  selectedQuestionId,
  onTopicChange,
  onQuestionChange
}) {
  return (
    <div className="mt-5 grid min-w-0 gap-4 md:grid-cols-2">
      <Select
        label="Topic"
        value={currentTopic}
        onChange={(event) => onTopicChange(event.target.value)}
      >
        {topics.map(([topic, list]) => (
          <option key={topic} value={topic}>
            {topic} — {list.length} question{list.length === 1 ? '' : 's'}
          </option>
        ))}
      </Select>

      <Select
        label="Question"
        value={selectedQuestionId}
        onChange={(event) => onQuestionChange(event.target.value)}
        disabled={!topicQuestions.length}
      >
        {topicQuestions.length ? (
          topicQuestions.map((question) => (
            <option key={question._id} value={question._id}>{question.question}</option>
          ))
        ) : (
          <option value="">No questions available</option>
        )}
      </Select>
    </div>
  );
}
