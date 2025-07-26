import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { verifyAdminAccess } from './auth';

export async function GET(request: NextRequest) {
  // Verify admin access
  const isAdmin = await verifyAdminAccess(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const aiConfig = await kv.get('ai_config') || {
      openaiKey: '',
      anthropicKey: '',
      geminiKey: '',
      model: 'gpt-4',
      geminiModel: 'gemini-pro',
      temperature: 0.7,
      maxTokens: 2000,
      primaryProvider: 'openai',
      fallbackProvider: 'anthropic'
    };

    const scoringWeights = await kv.get('scoring_weights') || {
      emotional: 1.0,
      clarity: 1.0,
      persuasion: 1.0,
      cta: 1.0,
      engagement: 1.0,
      urgency: 1.0,
      trust: 1.0,
      benefits: 1.0,
      powerWords: 1.0,
      structure: 1.0,
      uniqueness: 1.0,
      audience: 1.0,
      conversion: 1.0,
      seo: 1.0,
      brand: 1.0,
      tone: 1.0,
      rhythm: 1.0,
      impact: 1.0,
      memorability: 1.0,
      shareability: 1.0,
      accessibility: 1.0,
      credibility: 1.0,
      specificity: 1.0,
      emotionalTriggers: 1.0,
      cognitiveLoad: 1.0
    };

    return NextResponse.json({
      ai: aiConfig,
      scoring_weights: scoringWeights
    });
  } catch (error) {
    console.error('Config GET error:', error);
    return NextResponse.json(
      { error: 'Failed to load configuration' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Verify admin access
  const isAdmin = await verifyAdminAccess(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { ai, scoring_weights } = await request.json();

    if (ai) {
      await kv.set('ai_config', ai);
    }

    if (scoring_weights) {
      await kv.set('scoring_weights', scoring_weights);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Config POST error:', error);
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    );
  }
} 