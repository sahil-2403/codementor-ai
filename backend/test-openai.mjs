import "dotenv/config";

const response = await fetch("https://api.openai.com/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
  },
  body: JSON.stringify({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: "Reply with only: OpenAI connected",
      },
    ],
    max_tokens: 20,
  }),
});

const data = await response.json();

if (!response.ok) {
  console.error("OpenAI test failed:");
  console.error(data?.error || data);
  process.exit(1);
}

console.log(data.choices?.[0]?.message?.content);
