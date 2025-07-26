import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { kv } from '@vercel/kv';
import { analyzeTextMetrics, generateWordSuggestions } from '../lib/textAnalyzer';

export async function POST(request: NextRequest) {
  try {
    const { copyText, copyType } = await request.json();

    if (!copyText || !copyType) {
      return NextResponse.json(
        { error: 'Copy text and type are required' },
        { status: 400 }
      );
    }

    // Get AI configuration
    const aiConfig = await kv.get('ai_config') as any || {
      openaiKey: process.env.OPENAI_API_KEY || '',
      anthropicKey: process.env.ANTHROPIC_API_KEY || '',
      geminiKey: process.env.GEMINI_API_KEY || '',
      model: 'gpt-4',
      geminiModel: 'gemini-pro',
      temperature: 0.7,
      maxTokens: 2000,
      primaryProvider: 'openai',
      fallbackProvider: 'anthropic'
    };

    // Get scoring weights
    const scoringWeights = await kv.get('scoring_weights') as any || {
      emotional: 1.0, clarity: 1.0, persuasion: 1.0, cta: 1.0, engagement: 1.0,
      urgency: 1.0, trust: 1.0, benefits: 1.0, powerWords: 1.0, structure: 1.0,
      uniqueness: 1.0, audience: 1.0, conversion: 1.0, seo: 1.0, brand: 1.0,
      tone: 1.0, rhythm: 1.0, impact: 1.0, memorability: 1.0, shareability: 1.0,
      accessibility: 1.0, credibility: 1.0, specificity: 1.0, emotionalTriggers: 1.0, cognitiveLoad: 1.0
    };

    // Analyze text metrics
    const metrics = analyzeTextMetrics(copyText, copyType);
    const wordSuggestions = generateWordSuggestions(copyText, copyType);

    // Calculate weighted scores
    const weightedScores = {
      emotional: metrics.emotional * scoringWeights.emotional,
      clarity: metrics.clarity * scoringWeights.clarity,
      persuasion: metrics.persuasion * scoringWeights.persuasion,
      cta: metrics.cta * scoringWeights.cta,
      engagement: metrics.engagement * scoringWeights.engagement,
      urgency: metrics.urgency * scoringWeights.urgency,
      trust: metrics.trust * scoringWeights.trust,
      benefits: metrics.benefits * scoringWeights.benefits,
      powerWords: metrics.powerWords * scoringWeights.powerWords,
      structure: metrics.structure * scoringWeights.structure,
      uniqueness: metrics.uniqueness * scoringWeights.uniqueness,
      audience: metrics.audience * scoringWeights.audience,
      conversion: metrics.conversion * scoringWeights.conversion,
      seo: metrics.seo * scoringWeights.seo,
      brand: metrics.brand * scoringWeights.brand,
      tone: metrics.tone * scoringWeights.tone,
      rhythm: metrics.rhythm * scoringWeights.rhythm,
      impact: metrics.impact * scoringWeights.impact,
      memorability: metrics.memorability * scoringWeights.memorability,
      shareability: metrics.shareability * scoringWeights.shareability,
      accessibility: metrics.accessibility * scoringWeights.accessibility,
      credibility: metrics.credibility * scoringWeights.credibility,
      specificity: metrics.specificity * scoringWeights.specificity,
      emotionalTriggers: metrics.emotionalTriggers * scoringWeights.emotionalTriggers,
      cognitiveLoad: metrics.cognitiveLoad * scoringWeights.cognitiveLoad
    };

    // Get AI insights
    let aiInsights = '';
    const providers = [aiConfig.primaryProvider, aiConfig.fallbackProvider];
    
    for (const provider of providers) {
      try {
        if (provider === 'openai' && aiConfig.openaiKey) {
          const openai = new OpenAI({ apiKey: aiConfig.openaiKey });
          const completion = await openai.chat.completions.create({
            model: aiConfig.model,
            messages: [{
              role: 'system',
              content: `You are an expert copywriter and marketing analyst. Analyze this ${copyType} copy and provide specific, actionable insights for improvement. Focus on the 24 key parameters we've analyzed.`
            }, {
              role: 'user',
              content: `Copy: "${copyText}"\n\nAnalysis Results:\n${Object.entries(weightedScores).map(([key, value]) => `${key}: ${value.toFixed(1)}/10`).join('\n')}\n\nProvide specific, actionable insights for improvement.`
            }],
            temperature: aiConfig.temperature,
            max_tokens: aiConfig.maxTokens
          });
          aiInsights = completion.choices[0]?.message?.content || '';
          break;
        } else if (provider === 'anthropic' && aiConfig.anthropicKey) {
          const anthropic = new Anthropic({ apiKey: aiConfig.anthropicKey });
          const message = await anthropic.messages.create({
            model: 'claude-3-sonnet-20240229',
            max_tokens: aiConfig.maxTokens,
            temperature: aiConfig.temperature,
            messages: [{
              role: 'user',
              content: `You are an expert copywriter and marketing analyst. Analyze this ${copyType} copy and provide specific, actionable insights for improvement. Focus on the 24 key parameters we've analyzed.\n\nCopy: "${copyText}"\n\nAnalysis Results:\n${Object.entries(weightedScores).map(([key, value]) => `${key}: ${value.toFixed(1)}/10`).join('\n')}\n\nProvide specific, actionable insights for improvement.`
            }]
          });
          aiInsights = message.content[0]?.text || '';
          break;
        } else if (provider === 'gemini' && aiConfig.geminiKey) {
          const genAI = new GoogleGenerativeAI(aiConfig.geminiKey);
          const model = genAI.getGenerativeModel({ model: aiConfig.geminiModel });
          const result = await model.generateContent(`You are an expert copywriter and marketing analyst. Analyze this ${copyType} copy and provide specific, actionable insights for improvement. Focus on the 24 key parameters we've analyzed.\n\nCopy: "${copyText}"\n\nAnalysis Results:\n${Object.entries(weightedScores).map(([key, value]) => `${key}: ${value.toFixed(1)}/10`).join('\n')}\n\nProvide specific, actionable insights for improvement.`);
          aiInsights = result.response.text();
          break;
        }
      } catch (error) {
        console.error(`${provider} API error:`, error);
        continue;
      }
    }

    // Update analytics
    const analytics = await kv.get('analytics') as any || {
      totalAnalyses: 0,
      averageScores: {},
      popularCopyTypes: {}
    };
    
    analytics.totalAnalyses = (analytics.totalAnalyses || 0) + 1;
    analytics.popularCopyTypes[copyType] = (analytics.popularCopyTypes[copyType] || 0) + 1;
    
    await kv.set('analytics', analytics);

    return NextResponse.json({
      success: true,
      metrics: weightedScores,
      wordSuggestions,
      aiInsights,
      copyType,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze copy' },
      { status: 500 }
    );
  }
} 