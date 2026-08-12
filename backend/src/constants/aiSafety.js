export const AI_SAFETY = {
  MAX_MENTOR_PROMPT_CHARS: Number(process.env.MAX_MENTOR_PROMPT_CHARS || 1000),
  MAX_PROJECT_CODE_CHARS: Number(process.env.MAX_PROJECT_CODE_CHARS || 15000),
  MAX_PROJECT_EXPLANATION_CHARS: Number(process.env.MAX_PROJECT_EXPLANATION_CHARS || 4000),
  MAX_INTERVIEW_ANSWER_CHARS: Number(process.env.MAX_INTERVIEW_ANSWER_CHARS || 3000),
  MAX_CONTEXT_CHARS: Number(process.env.MAX_AI_CONTEXT_CHARS || 5000)
};

export const UNSUPPORTED_AI_PATTERNS = [
  /ignore previous instructions/i,
  /system prompt/i,
  /developer message/i,
  /jailbreak/i,
  /act as.*unrestricted/i
];
