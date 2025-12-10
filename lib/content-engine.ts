import { model } from '@/lib/gemini';

export async function generateContent(topic: string) {
  // 1. "Research" Phase
  const researchPrompt = `You are a social media trend researcher. Analyze the topic "${topic}" and find 3 viral angles that would resonate with a general audience. Return the result as a list.`;

  console.log('[ContentEngine] Starting research for:', topic);
  const researchResult = await model.generateContent(researchPrompt);
  const researchText = researchResult.response.text();
  console.log('[ContentEngine] Research completed:', researchText.slice(0, 50) + '...');

  // 2. Draft Phase
  const draftPrompt = `You are a top-tier ghostwriter for X (Twitter).
  Create a high-performing tweet based on the Research provided below.
  
  Research:
  ${researchText}
  
  Guidelines:
  - Use short sentences.
  - Start with a strong hook.
  - Don't use hashtags unless necessary (max 1).
  - Make it sound human, not AI.
  - Focus on value or entertainment.
  - If it's a thread, separate tweets with "---".
  - Output ONLY the tweet content.
  `;

  const draftResult = await model.generateContent(draftPrompt);
  return draftResult.response.text();
}
