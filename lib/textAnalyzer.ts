import nlp from 'compromise';
import Sentiment from 'sentiment';
import { getReadabilityScore } from 'readability-score';

export interface AnalysisResult {
  emotional: number;
  clarity: number;
  persuasion: number;
  cta: number;
  engagement: number;
  urgency: number;
  trust: number;
  benefits: number;
  powerWords: number;
  structure: number;
  uniqueness: number;
  audience: number;
  conversion: number;
  seo: number;
  brand: number;
  tone: number;
  rhythm: number;
  impact: number;
  memorability: number;
  shareability: number;
  accessibility: number;
  credibility: number;
  specificity: number;
  emotionalTriggers: number;
  cognitiveLoad: number;
}

export interface WordSuggestion {
  original: string;
  suggestions: string[];
  reason: string;
  impact: string;
  category: 'weak' | 'negative' | 'vague' | 'jargon' | 'passive' | 'emotional' | 'power';
}

export function analyzeTextMetrics(text: string, copyType: string): AnalysisResult {
  const doc = nlp(text);
  const sentiment = new Sentiment();
  const sentimentResult = sentiment.analyze(text);
  
  // Basic text analysis
  const sentences = doc.sentences().out('array');
  const words = doc.words().out('array');
  const wordCount = words.length;
  const sentenceCount = sentences.length;
  const avgSentenceLength = wordCount / sentenceCount;
  
  // Readability score
  const readabilityScore = getReadabilityScore(text);
  
  // Calculate all metrics
  return {
    emotional: calculateEmotionalScore(text, sentimentResult),
    clarity: calculateClarityScore(text, readabilityScore, avgSentenceLength),
    persuasion: calculatePersuasionScore(text, copyType),
    cta: calculateCTAScore(text),
    engagement: calculateEngagementScore(text, wordCount),
    urgency: calculateUrgencyScore(text),
    trust: calculateTrustScore(text),
    benefits: calculateBenefitsScore(text),
    powerWords: calculatePowerWordsScore(text),
    structure: calculateStructureScore(text, sentenceCount, avgSentenceLength),
    uniqueness: calculateUniquenessScore(text),
    audience: calculateAudienceScore(text, copyType),
    conversion: calculateConversionScore(text),
    seo: calculateSEOScore(text),
    brand: calculateBrandScore(text),
    tone: calculateToneScore(text, copyType),
    rhythm: calculateRhythmScore(text, sentences),
    impact: calculateImpactScore(text, sentimentResult),
    memorability: calculateMemorabilityScore(text),
    shareability: calculateShareabilityScore(text),
    accessibility: calculateAccessibilityScore(text, readabilityScore),
    credibility: calculateCredibilityScore(text),
    specificity: calculateSpecificityScore(text),
    emotionalTriggers: calculateEmotionalTriggersScore(text),
    cognitiveLoad: calculateCognitiveLoadScore(text, readabilityScore)
  };
}

export function generateWordSuggestions(text: string, copyType: string): WordSuggestion[] {
  const suggestions: WordSuggestion[] = [];
  const doc = nlp(text);
  const words = doc.words().out('array');
  
  // Weak words
  const weakWords = ['very', 'really', 'quite', 'somewhat', 'kind of', 'sort of', 'maybe', 'perhaps'];
  weakWords.forEach(word => {
    if (text.toLowerCase().includes(word)) {
      suggestions.push({
        original: word,
        suggestions: ['extremely', 'incredibly', 'remarkably', 'significantly'],
        reason: 'Weakens the impact of your message',
        impact: 'High',
        category: 'weak'
      });
    }
  });
  
  // Negative words
  const negativeWords = ['problem', 'difficult', 'hard', 'challenging', 'issue', 'trouble'];
  negativeWords.forEach(word => {
    if (text.toLowerCase().includes(word)) {
      suggestions.push({
        original: word,
        suggestions: ['opportunity', 'solution', 'advantage', 'benefit'],
        reason: 'Creates negative associations',
        impact: 'Medium',
        category: 'negative'
      });
    }
  });
  
  // Vague words
  const vagueWords = ['thing', 'stuff', 'something', 'anything', 'everything'];
  vagueWords.forEach(word => {
    if (text.toLowerCase().includes(word)) {
      suggestions.push({
        original: word,
        suggestions: ['solution', 'product', 'service', 'feature'],
        reason: 'Too vague and non-specific',
        impact: 'Medium',
        category: 'vague'
      });
    }
  });
  
  // Jargon
  const jargonWords = ['paradigm', 'synergy', 'leverage', 'optimize', 'streamline'];
  jargonWords.forEach(word => {
    if (text.toLowerCase().includes(word)) {
      suggestions.push({
        original: word,
        suggestions: ['approach', 'work together', 'use', 'improve', 'simplify'],
        reason: 'Corporate jargon that alienates readers',
        impact: 'High',
        category: 'jargon'
      });
    }
  });
  
  // Passive voice
  const passiveIndicators = ['is', 'are', 'was', 'were', 'be', 'been', 'being'];
  passiveIndicators.forEach(indicator => {
    if (text.toLowerCase().includes(indicator + ' by') || text.toLowerCase().includes(indicator + ' with')) {
      suggestions.push({
        original: indicator,
        suggestions: ['actively', 'directly', 'immediately'],
        reason: 'Passive voice reduces impact',
        impact: 'Medium',
        category: 'passive'
      });
    }
  });
  
  // Emotional enhancement opportunities
  const emotionalTriggers = ['imagine', 'feel', 'experience', 'discover'];
  emotionalTriggers.forEach(trigger => {
    if (!text.toLowerCase().includes(trigger)) {
      suggestions.push({
        original: 'add emotional trigger',
        suggestions: [trigger],
        reason: 'Add emotional connection to your message',
        impact: 'High',
        category: 'emotional'
      });
    }
  });
  
  // Power words
  const powerWords = ['exclusive', 'limited', 'guaranteed', 'proven', 'instant'];
  powerWords.forEach(powerWord => {
    if (!text.toLowerCase().includes(powerWord)) {
      suggestions.push({
        original: 'add power word',
        suggestions: [powerWord],
        reason: 'Increase persuasiveness and urgency',
        impact: 'High',
        category: 'power'
      });
    }
  });
  
  return suggestions.slice(0, 10); // Limit to top 10 suggestions
}

export function replaceWordsInText(text: string, replacements: { original: string; replacement: string }[]): string {
  let updatedText = text;
  
  replacements.forEach(({ original, replacement }) => {
    const regex = new RegExp(`\\b${original}\\b`, 'gi');
    updatedText = updatedText.replace(regex, replacement);
  });
  
  return updatedText;
}

// Calculation functions for each metric
function calculateEmotionalScore(text: string, sentimentResult: any): number {
  const score = Math.max(0, Math.min(100, (sentimentResult.score + 5) * 10));
  return Math.round(score);
}

function calculateClarityScore(text: string, readabilityScore: number, avgSentenceLength: number): number {
  const readabilityFactor = Math.max(0, Math.min(100, readabilityScore * 10));
  const sentenceLengthFactor = avgSentenceLength <= 20 ? 100 : Math.max(0, 100 - (avgSentenceLength - 20) * 2);
  return Math.round((readabilityFactor + sentenceLengthFactor) / 2);
}

function calculatePersuasionScore(text: string, copyType: string): number {
  const persuasiveElements = ['because', 'proven', 'guaranteed', 'exclusive', 'limited', 'now', 'today'];
  const count = persuasiveElements.filter(element => text.toLowerCase().includes(element)).length;
  return Math.round(Math.min(100, count * 15));
}

function calculateCTAScore(text: string): number {
  const ctaWords = ['buy', 'order', 'sign up', 'subscribe', 'get', 'download', 'start', 'try'];
  const hasCTA = ctaWords.some(word => text.toLowerCase().includes(word));
  return hasCTA ? 85 : 30;
}

function calculateEngagementScore(text: string, wordCount: number): number {
  const questions = (text.match(/\?/g) || []).length;
  const exclamations = (text.match(/!/g) || []).length;
  const engagement = questions * 10 + exclamations * 5 + Math.min(50, wordCount / 2);
  return Math.round(Math.min(100, engagement));
}

function calculateUrgencyScore(text: string): number {
  const urgencyWords = ['now', 'today', 'limited', 'expires', 'deadline', 'hurry', 'fast'];
  const count = urgencyWords.filter(word => text.toLowerCase().includes(word)).length;
  return Math.round(Math.min(100, count * 20));
}

function calculateTrustScore(text: string): number {
  const trustWords = ['guaranteed', 'proven', 'tested', 'trusted', 'reliable', 'secure', 'safe'];
  const count = trustWords.filter(word => text.toLowerCase().includes(word)).length;
  return Math.round(Math.min(100, count * 15));
}

function calculateBenefitsScore(text: string): number {
  const benefitWords = ['benefit', 'advantage', 'improve', 'increase', 'save', 'gain', 'achieve'];
  const count = benefitWords.filter(word => text.toLowerCase().includes(word)).length;
  return Math.round(Math.min(100, count * 15));
}

function calculatePowerWordsScore(text: string): number {
  const powerWords = ['exclusive', 'limited', 'guaranteed', 'proven', 'instant', 'revolutionary', 'breakthrough'];
  const count = powerWords.filter(word => text.toLowerCase().includes(word)).length;
  return Math.round(Math.min(100, count * 15));
}

function calculateStructureScore(text: string, sentenceCount: number, avgSentenceLength: number): number {
  const structureScore = sentenceCount >= 3 ? 80 : 40;
  const lengthScore = avgSentenceLength >= 10 && avgSentenceLength <= 25 ? 100 : Math.max(0, 100 - Math.abs(avgSentenceLength - 17.5) * 2);
  return Math.round((structureScore + lengthScore) / 2);
}

function calculateUniquenessScore(text: string): number {
  const words = text.toLowerCase().split(/\s+/);
  const uniqueWords = new Set(words);
  const uniqueness = (uniqueWords.size / words.length) * 100;
  return Math.round(Math.min(100, uniqueness * 1.5));
}

function calculateAudienceScore(text: string, copyType: string): number {
  const audienceWords = ['you', 'your', 'yours', 'yourself'];
  const count = audienceWords.filter(word => text.toLowerCase().includes(word)).length;
  return Math.round(Math.min(100, count * 20));
}

function calculateConversionScore(text: string): number {
  const conversionWords = ['buy', 'order', 'sign up', 'subscribe', 'get', 'download', 'start', 'try', 'now'];
  const count = conversionWords.filter(word => text.toLowerCase().includes(word)).length;
  return Math.round(Math.min(100, count * 12));
}

function calculateSEOScore(text: string): number {
  const seoFactors = text.length > 100 ? 20 : 0;
  const keywordDensity = text.split(/\s+/).length > 10 ? 30 : 0;
  const hasHeadings = text.includes('#') || text.includes('**') ? 25 : 0;
  const hasLinks = text.includes('http') ? 25 : 0;
  return seoFactors + keywordDensity + hasHeadings + hasLinks;
}

function calculateBrandScore(text: string): number {
  const brandElements = ['brand', 'company', 'product', 'service', 'solution'];
  const count = brandElements.filter(word => text.toLowerCase().includes(word)).length;
  return Math.round(Math.min(100, count * 20));
}

function calculateToneScore(text: string, copyType: string): number {
  const formalWords = ['therefore', 'furthermore', 'moreover', 'consequently'];
  const casualWords = ['hey', 'awesome', 'cool', 'great'];
  const formalCount = formalWords.filter(word => text.toLowerCase().includes(word)).length;
  const casualCount = casualWords.filter(word => text.toLowerCase().includes(word)).length;
  
  if (copyType === 'email' && formalCount > casualCount) return 85;
  if (copyType === 'social' && casualCount > formalCount) return 85;
  return 70;
}

function calculateRhythmScore(text: string, sentences: string[]): number {
  const variedLengths = sentences.length > 2;
  const hasQuestions = sentences.some(s => s.includes('?'));
  const hasExclamations = sentences.some(s => s.includes('!'));
  const rhythmScore = (variedLengths ? 30 : 0) + (hasQuestions ? 25 : 0) + (hasExclamations ? 25 : 0) + 20;
  return Math.round(rhythmScore);
}

function calculateImpactScore(text: string, sentimentResult: any): number {
  const sentimentImpact = Math.abs(sentimentResult.score) * 10;
  const emotionalWords = ['amazing', 'incredible', 'fantastic', 'terrible', 'awful', 'wonderful'];
  const emotionalCount = emotionalWords.filter(word => text.toLowerCase().includes(word)).length;
  const impact = sentimentImpact + emotionalCount * 10;
  return Math.round(Math.min(100, impact));
}

function calculateMemorabilityScore(text: string): number {
  const memorableElements = ['story', 'example', 'imagine', 'picture', 'visualize'];
  const count = memorableElements.filter(word => text.toLowerCase().includes(word)).length;
  const alliteration = (text.match(/(\w)\1+/g) || []).length;
  return Math.round(Math.min(100, count * 15 + alliteration * 10));
}

function calculateShareabilityScore(text: string): number {
  const shareableElements = ['share', 'tell', 'spread', 'viral', 'trending'];
  const count = shareableElements.filter(word => text.toLowerCase().includes(word)).length;
  const hasEmotion = Math.abs(new Sentiment().analyze(text).score) > 2;
  return Math.round(Math.min(100, count * 20 + (hasEmotion ? 30 : 0)));
}

function calculateAccessibilityScore(text: string, readabilityScore: number): number {
  const accessibilityScore = readabilityScore * 10;
  const shortWords = text.split(/\s+/).filter(word => word.length <= 6).length;
  const shortWordRatio = (shortWords / text.split(/\s+/).length) * 100;
  return Math.round((accessibilityScore + shortWordRatio) / 2);
}

function calculateCredibilityScore(text: string): number {
  const credibilityWords = ['research', 'study', 'data', 'statistics', 'expert', 'professional'];
  const count = credibilityWords.filter(word => text.toLowerCase().includes(word)).length;
  return Math.round(Math.min(100, count * 20));
}

function calculateSpecificityScore(text: string): number {
  const specificWords = text.match(/\d+/g) || [];
  const specificElements = ['percent', '%', 'dollars', '$', 'years', 'months', 'days'];
  const count = specificWords.length + specificElements.filter(word => text.toLowerCase().includes(word)).length;
  return Math.round(Math.min(100, count * 15));
}

function calculateEmotionalTriggersScore(text: string): number {
  const emotionalTriggers = ['fear', 'love', 'greed', 'pride', 'envy', 'anger', 'surprise'];
  const count = emotionalTriggers.filter(word => text.toLowerCase().includes(word)).length;
  return Math.round(Math.min(100, count * 15));
}

function calculateCognitiveLoadScore(text: string, readabilityScore: number): number {
  const cognitiveLoad = 100 - readabilityScore * 10;
  const complexWords = text.split(/\s+/).filter(word => word.length > 8).length;
  const complexWordRatio = (complexWords / text.split(/\s+/).length) * 100;
  return Math.round(Math.max(0, cognitiveLoad - complexWordRatio));
} 