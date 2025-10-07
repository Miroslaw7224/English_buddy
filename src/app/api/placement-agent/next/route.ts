import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const SYSTEM_PROMPT = `You are a certified CEFR examiner (A1–C2). 
Conduct an 8-turn English placement interview through text chat.
Ask one short, open-ended question per turn. 
Evaluate each answer using the CEFR criteria and record scores.

Do NOT give feedback during the test.
After the 8th turn, output ONLY the final JSON summary with detailed scores.

Scoring dimensions (0–5 each):
- comprehension: Does the user understand the question?
- task_response: Is the answer on-topic and complete?
- grammar_accuracy: Error count and control of structures
- lexical_range: Vocabulary richness, idioms, register
- fluency_coherence: Cohesion, linking, naturalness`;

const STATES = {
  WARMUP: { next: 'DESCRIBE', turn: 1 },
  DESCRIBE: { next: 'OPINION', turn: 2 },
  OPINION: { next: 'PROBLEM_SOLUTION', turn: 3 },
  PROBLEM_SOLUTION: { next: 'REPHRASE', turn: 4 },
  REPHRASE: { next: 'ABSTRACT', turn: 5 },
  ABSTRACT: { next: 'CHALLENGE', turn: 6 },
  CHALLENGE: { next: 'WRAPUP', turn: 7 },
  WRAPUP: { next: 'DONE', turn: 8 },
};

interface ScoreResult {
  comprehension: number; // 0-5
  task_response: number; // 0-5
  grammar_accuracy: number; // 0-5
  lexical_range: number; // 0-5
  fluency_coherence: number; // 0-5
  cefr_guess: string; // A1, A2, B1, B2, C1, C2
  feedback: string;
}

export async function POST(request: NextRequest) {
  try {
    const { session_id, user_message, state, history, estimate = 3.0, used_topics = [] } = await request.json();

    if (!session_id || !user_message || !state) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Evaluate user's response
    const scoreResult = await evaluateResponse(user_message, state, estimate);
    
    // Update estimate based on weighted score
    const weightedScore = 
      scoreResult.comprehension * 1 +
      scoreResult.task_response * 1 +
      scoreResult.grammar_accuracy * 2 +
      scoreResult.lexical_range * 2 +
      scoreResult.fluency_coherence * 1;
    
    const newEstimate = calculateNewEstimate(estimate, weightedScore, scoreResult.grammar_accuracy, scoreResult.lexical_range);
    
    // Log to database
    await logToDatabase(session_id, state, history[history.length - 1], user_message, scoreResult);

    // Determine next state
    const stateConfig = STATES[state as keyof typeof STATES];
    const nextState = stateConfig?.next || 'DONE';

    if (nextState === 'DONE') {
      // Test complete
      return NextResponse.json({
        state: 'DONE',
        turn: 8,
        total_turns: 8,
        score: scoreResult,
        final_estimate: newEstimate
      });
    }

    // Generate next question dynamically
    const { question, topic } = await generateNextQuestion(nextState, newEstimate, history, user_message, used_topics);
    
    // Track used topic
    const updatedTopics = [...used_topics, topic];

    return NextResponse.json({
      session_id,
      state: nextState,
      agent_message: question,
      turn: stateConfig.turn + 1,
      total_turns: 8,
      estimate: newEstimate,
      score: scoreResult,
      used_topics: updatedTopics
    });
  } catch (error) {
    console.error('Error processing placement agent turn:', error);
    return NextResponse.json(
      { error: 'Failed to process turn' },
      { status: 500 }
    );
  }
}

async function evaluateResponse(
  userMessage: string,
  state: string,
  estimate: number
): Promise<ScoreResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const evaluationPrompt = `Evaluate this English response according to CEFR criteria.
State: ${state}
Current estimate: ${cefrFromEstimate(estimate)}
User response: "${userMessage}"

Rate each dimension (0-5):
- comprehension: Does the user understand the question?
- task_response: Is the answer on-topic and complete?
- grammar_accuracy: Error count and control of structures (2× weight)
- lexical_range: Vocabulary richness, idioms, register (2× weight)
- fluency_coherence: Cohesion, linking, naturalness

Provide a CEFR guess (A1, A2, B1, B2, C1, C2) and brief feedback.

Respond ONLY with valid JSON:
{
  "comprehension": 0-5,
  "task_response": 0-5,
  "grammar_accuracy": 0-5,
  "lexical_range": 0-5,
  "fluency_coherence": 0-5,
  "cefr_guess": "B1",
  "feedback": "Brief feedback (max 30 words)"
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: evaluationPrompt }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      }),
    });

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error('OpenAI evaluation error:', error);
    // Fallback
    return {
      comprehension: 3,
      task_response: 3,
      grammar_accuracy: 3,
      lexical_range: 3,
      fluency_coherence: 3,
      cefr_guess: cefrFromEstimate(estimate),
      feedback: 'Evaluation unavailable'
    };
  }
}

async function generateNextQuestion(
  nextState: string,
  estimate: number,
  history: any[],
  lastUserMessage: string,
  usedTopics: string[]
): Promise<{ question: string; topic: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const cefrLevel = cefrFromEstimate(estimate);
  
  // Stage descriptions and guidelines
  const stageGuidelines = {
    DESCRIBE: "Ask about past experiences using appropriate tense (past simple/present perfect). Topics: travel, holidays, memorable events.",
    OPINION: "Ask for opinion with reasons. Use 'Do you think...?' or 'What's your view on...?'. Topics: social media, technology, education, environment.",
    PROBLEM_SOLUTION: "Present a hypothetical problem requiring modal verbs or conditionals. Topics: lost items, emergencies, difficult situations.",
    REPHRASE: "Ask user to rewrite/clarify their previous answer with better grammar or vocabulary.",
    ABSTRACT: "Ask hypothetical question requiring complex reasoning. Topics: what if scenarios, future predictions, philosophical questions.",
    CHALLENGE: `Ask complex analytical question. Level ${cefrLevel}: ${estimate >= 4.0 ? 'Use abstract concepts, require nuanced argumentation' : 'Ask about advantages/disadvantages'}`,
    WRAPUP: "Ask user to summarize the conversation in 2-3 sentences."
  };

  const guideline = stageGuidelines[nextState as keyof typeof stageGuidelines] || "Ask a follow-up question.";

  // Available topic categories
  const topicCategories = [
    "daily life", "work", "travel", "family", "technology", 
    "hobbies", "food", "health", "education", "environment",
    "social media", "culture", "sports", "entertainment", "future plans"
  ];

  const availableTopics = topicCategories.filter(t => !usedTopics.includes(t));
  const topicHint = availableTopics.length > 0 
    ? `Choose from unused topics: ${availableTopics.slice(0, 5).join(', ')}`
    : "Create a new original topic";

  const generationPrompt = `You are an adaptive CEFR examiner conducting an 8-turn placement test.

Current stage: ${nextState}
User's estimated CEFR level: ${cefrLevel}
Used topics so far: ${usedTopics.join(', ') || 'none'}

${guideline}

Requirements:
- Generate ONE original, natural question in English
- Adjust complexity to ${cefrLevel} level
- Avoid topics already discussed: ${usedTopics.join(', ') || 'none'}
- ${topicHint}
- Keep question short (1-2 sentences max)
- Make it conversational and natural

Respond ONLY with valid JSON:
{
  "question": "Your generated question here",
  "topic": "topic_category"
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: generationPrompt }
        ],
        temperature: 0.8, // Higher for variety
        response_format: { type: 'json_object' }
      }),
    });

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    return {
      question: result.question,
      topic: result.topic || 'general'
    };
  } catch (error) {
    console.error('Error generating question:', error);
    // Fallback to simple questions
    const fallbacks: Record<string, { question: string; topic: string }> = {
      DESCRIBE: { question: "Tell me about a place you visited recently.", topic: "travel" },
      OPINION: { question: "What do you think about social media?", topic: "technology" },
      PROBLEM_SOLUTION: { question: "What would you do if you lost your wallet?", topic: "problem-solving" },
      REPHRASE: { question: "Can you explain that in a different way?", topic: "clarification" },
      ABSTRACT: { question: "How do you think AI will change our lives?", topic: "future" },
      CHALLENGE: { question: "Do you agree that technology makes us less social?", topic: "technology" },
      WRAPUP: { question: "Please summarize our conversation.", topic: "summary" }
    };
    return fallbacks[nextState] || { question: "Thank you!", topic: "closing" };
  }
}

async function logToDatabase(
  sessionId: string,
  state: string,
  agentMessage: string,
  userMessage: string,
  scoreResult: ScoreResult
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    const dims_json = {
      comp: scoreResult.comprehension,
      task: scoreResult.task_response,
      gram: scoreResult.grammar_accuracy,
      lex: scoreResult.lexical_range,
      flu: scoreResult.fluency_coherence,
      cefr_guess: scoreResult.cefr_guess
    };

    await supabase.from('agent_logs').insert({
      session_id: sessionId,
      user_id: user.id,
      state,
      agent_msg: agentMessage,
      user_msg: userMessage,
      dims_json
    });
  } catch (error) {
    console.error('Error logging to database:', error);
  }
}

function calculateNewEstimate(currentEstimate: number, weightedScore: number, grammar: number, lexical: number): number {
  // Professional thresholds based on weighted scores (max 35: 5*1 + 5*1 + 5*2 + 5*2 + 5*1)
  // Mapped from raw 0-25 to weighted 0-35
  let cefrLevel = 1; // A1
  
  if (weightedScore >= 29) cefrLevel = 6; // C2 (22+ raw → ~29+ weighted)
  else if (weightedScore >= 26) cefrLevel = 5; // C1 (19-21 raw → ~25-28 weighted)
  else if (weightedScore >= 22) cefrLevel = 4; // B2 (16-18 raw → ~22-25 weighted)
  else if (weightedScore >= 18) cefrLevel = 3; // B1 (12-15 raw → ~17-21 weighted)
  else if (weightedScore >= 12) cefrLevel = 2; // A2 (8-11 raw → ~11-16 weighted)
  else cefrLevel = 1; // A1 (0-7 raw → ~0-10 weighted)
  
  // Penalty: if grammar < 3 or lexical < 3 → lower by 1 level
  if (grammar < 3 || lexical < 3) {
    cefrLevel = Math.max(1, cefrLevel - 1);
  }
  
  return cefrLevel;
}

function cefrFromEstimate(estimate: number): string {
  const level = Math.max(1, Math.min(6, Math.round(estimate)));
  return ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'][level - 1];
}

