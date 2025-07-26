import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { kv } from '@vercel/kv';

interface HumanizeRequest {
  copyText: string;
  copyType: string;
  tone?: 'professional' | 'casual' | 'friendly' | 'urgent';
  useModel?: 'openai' | 'anthropic' | 'gemini';
}

export async function POST(request: NextRequest) {
  try {
    const { copyText, copyType, tone = 'professional', useModel = 'openai' } = await request.json();

    if (!copyText) {
      return NextResponse.json(
        { error: 'Copy text is required' },
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
      maxTokens: 2000
    };

    let humanizedText = '';
    let improvements: string[] = [];

    const toneInstructions = {
      professional: 'maintain a professional, business-like tone while making it more natural and human',
      casual: 'make it more casual, friendly, and conversational',
      friendly: 'add warmth and friendliness while keeping it professional',
      urgent: 'add urgency and excitement while maintaining credibility'
    };

    const prompt = `
    Transform this ${copyType} copy to sound more human and natural while maintaining its core message and effectiveness. 
    
    Original copy: "${copyText}"
    
    Requirements:
    - ${toneInstructions[tone as keyof typeof toneInstructions]}
    - Keep the same key information and call-to-action
    - Make it sound like a real person wrote it
    - Avoid corporate jargon and robotic language
    - Maintain the same length and structure
    - Ensure it still converts and persuades
    
    Provide the humanized version and a brief list of key improvements made.
    `;

    try {
      if (useModel === 'openai' && aiConfig.openaiKey) {
        const openai = new OpenAI({ apiKey: aiConfig.openaiKey });
        const completion = await openai.chat.completions.create({
          model: aiConfig.model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert copywriter who specializes in making corporate and robotic copy sound more human and natural while maintaining effectiveness.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: aiConfig.temperature,
          max_tokens: aiConfig.maxTokens
        });
        
        const response = completion.choices[0]?.message?.content || '';
        const parts = response.split('\n\nImprovements:');
        humanizedText = parts[0]?.trim() || '';
        improvements = parts[1]?.split('\n').filter(line => line.trim() && line.trim().startsWith('-')) || [];
        
      } else if (useModel === 'anthropic' && aiConfig.anthropicKey) {
        const anthropic = new Anthropic({ apiKey: aiConfig.anthropicKey });
        const message = await anthropic.messages.create({
          model: 'claude-3-sonnet-20240229',
          max_tokens: aiConfig.maxTokens,
          temperature: aiConfig.temperature,
          messages: [{
            role: 'user',
            content: prompt
          }]
        });
        
        const response = message.content[0]?.text || '';
        const parts = response.split('\n\nImprovements:');
        humanizedText = parts[0]?.trim() || '';
        improvements = parts[1]?.split('\n').filter(line => line.trim() && line.trim().startsWith('-')) || [];
        
      } else if (useModel === 'gemini' && aiConfig.geminiKey) {
        const genAI = new GoogleGenerativeAI(aiConfig.geminiKey);
        const model = genAI.getGenerativeModel({ model: aiConfig.geminiModel });
        const result = await model.generateContent(prompt);
        
        const response = result.response.text();
        const parts = response.split('\n\nImprovements:');
        humanizedText = parts[0]?.trim() || '';
        improvements = parts[1]?.split('\n').filter(line => line.trim() && line.trim().startsWith('-')) || [];
        
      } else {
        return NextResponse.json(
          { error: 'No valid AI provider configured' },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('AI humanization error:', error);
      return NextResponse.json(
        { error: 'Failed to humanize copy with AI' },
        { status: 500 }
      );
    }

    // Update analytics
    const analytics = await kv.get('analytics') as any || {
      totalHumanizations: 0,
      humanizationHistory: []
    };
    
    analytics.totalHumanizations = (analytics.totalHumanizations || 0) + 1;
    analytics.humanizationHistory = analytics.humanizationHistory || [];
    analytics.humanizationHistory.push({
      timestamp: new Date().toISOString(),
      copyType,
      tone,
      model: useModel,
      originalLength: copyText.length,
      humanizedLength: humanizedText.length
    });
    
    // Keep only last 100 entries
    if (analytics.humanizationHistory.length > 100) {
      analytics.humanizationHistory = analytics.humanizationHistory.slice(-100);
    }
    
    await kv.set('analytics', analytics);

    return NextResponse.json({
      success: true,
      originalText: copyText,
      humanizedText,
      improvements,
      tone,
      model: useModel,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Humanize error:', error);
    return NextResponse.json(
      { error: 'Failed to humanize copy' },
      { status: 500 }
    );
  }
} 