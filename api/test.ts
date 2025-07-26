import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const { provider, apiKey } = await request.json();

    if (!provider || !apiKey) {
      return NextResponse.json({ 
        success: false, 
        message: 'Provider and API key are required' 
      });
    }

    switch (provider) {
      case 'openai':
        return await testOpenAI(apiKey);
      case 'anthropic':
        return await testAnthropic(apiKey);
      case 'gemini':
        return await testGemini(apiKey);
      default:
        return NextResponse.json({ 
          success: false, 
          message: 'Invalid provider' 
        });
    }
  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Test failed: ' + (error as Error).message 
    });
  }
}

async function testOpenAI(apiKey: string) {
  try {
    // Validate API key format
    if (!apiKey.startsWith('sk-')) {
      return NextResponse.json({
        success: false,
        message: 'Invalid OpenAI API key format. Should start with "sk-"'
      });
    }

    const openai = new OpenAI({ apiKey });
    
    // Test with a simple completion instead of listing models
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 5
    });

    return NextResponse.json({
      success: true,
      message: 'OpenAI connection successful',
      models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'gpt-4o', 'gpt-4o-mini'],
      responseLength: completion.choices[0].message.content?.length || 0
    });
  } catch (error) {
    const errorMessage = (error as Error).message;
    if (errorMessage.includes('401')) {
      return NextResponse.json({
        success: false,
        message: 'Invalid OpenAI API key. Please check your key at https://platform.openai.com/account/api-keys'
      });
    }
    return NextResponse.json({
      success: false,
      message: 'OpenAI connection failed: ' + errorMessage
    });
  }
}

async function testAnthropic(apiKey: string) {
  try {
    // Validate API key format
    if (!apiKey.startsWith('sk-ant-')) {
      return NextResponse.json({
        success: false,
        message: 'Invalid Anthropic API key format. Should start with "sk-ant-"'
      });
    }

    const anthropic = new Anthropic({ apiKey });
    
    // Test connection by making a simple request
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Hello' }]
    });

    return NextResponse.json({
      success: true,
      message: 'Anthropic connection successful',
      models: ['claude-3-sonnet-20240229', 'claude-3-haiku-20240307', 'claude-3-opus-20240229'],
      responseLength: response.content[0].text.length
    });
  } catch (error) {
    const errorMessage = (error as Error).message;
    if (errorMessage.includes('401')) {
      return NextResponse.json({
        success: false,
        message: 'Invalid Anthropic API key. Please check your key at https://console.anthropic.com/'
      });
    }
    return NextResponse.json({
      success: false,
      message: 'Anthropic connection failed: ' + errorMessage
    });
  }
}

async function testGemini(apiKey: string) {
  try {
    // Validate API key format
    if (!apiKey.startsWith('AIza')) {
      return NextResponse.json({
        success: false,
        message: 'Invalid Gemini API key format. Should start with "AIza"'
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Test connection with the correct model name
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent('Hello');
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({
      success: true,
      message: 'Gemini connection successful',
      models: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.5-flash-exp', 'gemini-pro'],
      responseLength: text.length
    });
  } catch (error) {
    const errorMessage = (error as Error).message;
    if (errorMessage.includes('404')) {
      return NextResponse.json({
        success: false,
        message: 'Gemini API key might be invalid or model not found. Please check your key at https://makersuite.google.com/app/apikey'
      });
    }
    return NextResponse.json({
      success: false,
      message: 'Gemini connection failed: ' + errorMessage
    });
  }
} 