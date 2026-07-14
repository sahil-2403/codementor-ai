import 'dotenv/config';

const apiKey = process.env.GEMINI_API_KEY;
const modelFromEnv = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
const model = modelFromEnv.replace(/^models\//, '');

if (!apiKey) {
  console.error('GEMINI_API_KEY is missing in backend/.env');
  process.exitCode = 1;
} else {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: 'You are a helpful coding mentor. Reply briefly.'
            }
          ]
        },
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: 'Reply with only: Gemini connected'
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 30
        }
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('Gemini test failed:');
      console.error(JSON.stringify(data?.error || data, null, 2));
      process.exitCode = 1;
    } else {
      const text =
        data?.candidates?.[0]?.content?.parts
          ?.map((part) => part.text)
          .filter(Boolean)
          .join('\n')
          .trim() || '';

      if (!text) {
        console.error('Gemini responded, but no text was returned:');
        console.error(JSON.stringify(data, null, 2));
        process.exitCode = 1;
      } else {
        console.log(text);
      }
    }
  } catch (error) {
    console.error('Request failed:');
    console.error(error.message);
    process.exitCode = 1;
  }
}