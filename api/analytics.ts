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
    // Get analytics data from KV store
    const totalAnalyses = await kv.get('analytics:total_analyses') || 0;
    const totalHumanizations = await kv.get('analytics:total_humanizations') || 0;
    const avgScore = await kv.get('analytics:avg_score') || 0;
    
    // Get popular copy types
    const copyTypeStats = await kv.get('analytics:copy_types') || {
      'Email Marketing': 25,
      'Sales Pages': 20,
      'Social Media': 18,
      'Blog Posts': 15,
      'Landing Pages': 12
    };

    return NextResponse.json({
      totalAnalyses,
      totalHumanizations,
      avgScore,
      popularCopyTypes: copyTypeStats
    });
  } catch (error) {
    console.error('Analytics GET error:', error);
    return NextResponse.json(
      { error: 'Failed to load analytics' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { type, score } = await request.json();

    if (type === 'analysis') {
      const currentTotal = await kv.get('analytics:total_analyses') || 0;
      await kv.set('analytics:total_analyses', currentTotal + 1);

      // Update average score
      const currentAvg = await kv.get('analytics:avg_score') || 0;
      const currentCount = await kv.get('analytics:total_analyses') || 1;
      const newAvg = ((currentAvg * (currentCount - 1)) + score) / currentCount;
      await kv.set('analytics:avg_score', newAvg);
    }

    if (type === 'humanization') {
      const currentTotal = await kv.get('analytics:total_humanizations') || 0;
      await kv.set('analytics:total_humanizations', currentTotal + 1);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics POST error:', error);
    return NextResponse.json(
      { error: 'Failed to update analytics' },
      { status: 500 }
    );
  }
} 