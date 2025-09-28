import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Get current month's usage
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const { data: usage } = await supabase
      .from('usage_metrics')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', currentMonth)
      .eq('year', currentYear)
      .single();

    // Get user profile for fallback data
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      subscription: subscription || {
        plan: profile?.plan || 'free',
        status: 'active',
        pages_limit: profile?.pages_limit || 10,
        amount: 0,
        current_period_end: null
      },
      usage: usage || {
        pages_processed: profile?.pages_used || 0,
        pages_limit: profile?.pages_limit || 10,
        storage_used: 0,
        storage_limit: 524288000, // 500MB
        api_calls: 0,
        api_limit: 1000
      }
    });

  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}