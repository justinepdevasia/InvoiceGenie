import { createClient } from '@/lib/supabase/server';

export interface UsageResult {
  success: boolean;
  remaining: number;
  limit: number;
  error?: string;
}

export async function checkUsageLimit(userId: string, pagesNeeded: number = 1): Promise<UsageResult> {
  try {
    const supabase = await createClient();

    // Get current month and year
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Get user's subscription and limits
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const pagesLimit = subscription?.pages_limit || profile?.pages_limit || 10;

    // Get or create current month's usage
    const { data: usage } = await supabase
      .from('usage_metrics')
      .select('*')
      .eq('user_id', userId)
      .eq('month', currentMonth)
      .eq('year', currentYear)
      .single();

    let currentUsage = 0;
    if (usage) {
      currentUsage = usage.pages_processed || 0;
    } else {
      // Create usage record for current month
      await supabase
        .from('usage_metrics')
        .insert({
          user_id: userId,
          month: currentMonth,
          year: currentYear,
          pages_processed: 0,
          pages_limit: pagesLimit,
        });
    }

    const remainingPages = pagesLimit - currentUsage;

    if (remainingPages < pagesNeeded) {
      return {
        success: false,
        remaining: remainingPages,
        limit: pagesLimit,
        error: `Insufficient pages remaining. You have ${remainingPages} pages left but need ${pagesNeeded}.`
      };
    }

    return {
      success: true,
      remaining: remainingPages,
      limit: pagesLimit
    };

  } catch (error) {
    console.error('Error checking usage limit:', error);
    return {
      success: false,
      remaining: 0,
      limit: 10,
      error: 'Failed to check usage limit'
    };
  }
}

export async function incrementUsage(userId: string, pagesUsed: number = 1): Promise<void> {
  try {
    const supabase = await createClient();

    // Get current month and year
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Get user's limits
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('pages_limit')
      .eq('user_id', userId)
      .single();

    const { data: profile } = await supabase
      .from('profiles')
      .select('pages_limit, pages_used')
      .eq('id', userId)
      .single();

    const pagesLimit = subscription?.pages_limit || profile?.pages_limit || 10;

    // Get current usage for this month
    const { data: currentUsage } = await supabase
      .from('usage_metrics')
      .select('pages_processed')
      .eq('user_id', userId)
      .eq('month', currentMonth)
      .eq('year', currentYear)
      .single();

    const newPagesProcessed = (currentUsage?.pages_processed || 0) + pagesUsed;

    // Update usage metrics for current month
    const { error: usageError } = await supabase
      .from('usage_metrics')
      .upsert({
        user_id: userId,
        month: currentMonth,
        year: currentYear,
        pages_limit: pagesLimit,
        pages_processed: newPagesProcessed,
      }, {
        onConflict: 'user_id,month,year'
      });

    if (usageError) {
      console.error('Error updating usage metrics:', usageError);
    }

    // Also update the profile pages_used for backward compatibility
    const newPagesUsed = (profile?.pages_used || 0) + pagesUsed;
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        pages_used: newPagesUsed,
        pages_limit: pagesLimit
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Error updating profile usage:', profileError);
    }

  } catch (error) {
    console.error('Error incrementing usage:', error);
  }
}

export async function getCurrentUsage(userId: string) {
  try {
    const supabase = await createClient();

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const { data: usage } = await supabase
      .from('usage_metrics')
      .select('*')
      .eq('user_id', userId)
      .eq('month', currentMonth)
      .eq('year', currentYear)
      .single();

    const { data: profile } = await supabase
      .from('profiles')
      .select('pages_used, pages_limit')
      .eq('id', userId)
      .single();

    return {
      pages_processed: usage?.pages_processed || profile?.pages_used || 0,
      pages_limit: usage?.pages_limit || profile?.pages_limit || 10,
      storage_used: usage?.storage_used || 0,
      storage_limit: usage?.storage_limit || 524288000,
      api_calls: usage?.api_calls || 0,
      api_limit: usage?.api_limit || 1000
    };

  } catch (error) {
    console.error('Error getting current usage:', error);
    return {
      pages_processed: 0,
      pages_limit: 10,
      storage_used: 0,
      storage_limit: 524288000,
      api_calls: 0,
      api_limit: 1000
    };
  }
}