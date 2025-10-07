import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const sessionId = uuidv4();
    
    const initialMessage = "Hello! I'm your English level examiner. I'll conduct a short conversation to assess your CEFR level (A1-C2). Please answer naturally. Let's begin: Tell me about your typical day.";
    
    return NextResponse.json({
      session_id: sessionId,
      state: 'WARMUP',
      agent_message: initialMessage,
      turn: 1,
      total_turns: 8
    });
  } catch (error) {
    console.error('Error starting placement agent:', error);
    return NextResponse.json(
      { error: 'Failed to start placement test' },
      { status: 500 }
    );
  }
}

