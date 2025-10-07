import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { session_id, final_cefr, confidence, scores } = await request.json();

    if (!session_id || !final_cefr) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      console.error('No authorization header in finalize request');
      return NextResponse.json(
        { error: 'Unauthorized - no auth header' },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log('Finalize API - Auth check:', { user: user?.id, authError });
    
    if (!user) {
      console.error('No user found in finalize API', authError);
      return NextResponse.json(
        { error: 'Unauthorized - invalid token' },
        { status: 401 }
      );
    }

    // Get all feedback from agent_logs for this session
    let allFeedback: string[] = [];
    
    try {
      const { data: logs, error: logsError } = await supabase
        .from('agent_logs')
        .select('dims_json, state, user_msg')
        .eq('session_id', session_id)
        .order('id', { ascending: true });

      console.log('Finalize API - Logs query result:', { logs, logsError, session_id });

      if (logsError) {
        console.error('Error fetching agent logs:', logsError);
        // Continue without feedback if logs fail
      } else if (logs && logs.length > 0) {
        logs.forEach((log, index) => {
          console.log(`Log ${index}:`, log);
          // Generate feedback from dims_json data
          if (log.dims_json) {
            if (log.dims_json.corrected && log.user_msg !== log.dims_json.corrected) {
              const feedback = `Pytanie ${index + 1}:\nTwoja odpowiedź: ${log.user_msg}\nPoprawna forma: ${log.dims_json.corrected}`;
              allFeedback.push(feedback);
            } else {
              const feedback = `Pytanie ${index + 1}: Odpowiedź poprawna ✓`;
              allFeedback.push(feedback);
            }
          }
        });
      }

      console.log('Finalize API - Extracted feedback:', allFeedback);
    } catch (error) {
      console.error('Error processing logs:', error);
      // Continue without feedback if logs fail
    }

    // Update user_profil
    const { error } = await supabase
      .from('user_profil')
      .upsert({
        user_id: user.id,
        cefr_level: final_cefr,
        placement_score: Math.round((confidence || 0.8) * 100),
        placement_mode: 'adaptive',
        placement_source: 'ai',
        placement_taken_at: new Date().toISOString(),
        answers: JSON.stringify({ session_id, scores })
      }, {
        onConflict: 'user_id'
      });

    console.log('Finalize API - User profil update result:', { error, user_id: user.id });

    if (error) {
      console.error('Error updating user_profil:', error);
      return NextResponse.json(
        { error: 'Failed to save results', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      cefr_level: final_cefr,
      feedback: allFeedback
    });
  } catch (error) {
    console.error('Error finalizing placement test:', error);
    return NextResponse.json(
      { error: 'Failed to finalize test' },
      { status: 500 }
    );
  }
}

