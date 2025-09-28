import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const supabase = await createClient();

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(subscription, supabase);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCancellation(subscription, supabase);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleSuccessfulPayment(invoice, supabase);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleFailedPayment(invoice, supabase);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription, supabase: any) {
  try {
    console.log('Handling subscription change:', subscription.id);

    // Get customer to find user
    const customer = await stripe.customers.retrieve(subscription.customer as string);
    if (!customer || customer.deleted) {
      console.error('Customer not found or deleted');
      return;
    }

    const customerEmail = (customer as Stripe.Customer).email;
    if (!customerEmail) {
      console.error('Customer email not found');
      return;
    }

    // Find user by email
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserByEmail(customerEmail);
    if (authError || !authUser?.user) {
      console.error('User not found for email:', customerEmail, authError);
      return;
    }

    const userId = authUser.user.id;

    // Get price details to determine plan
    const priceId = subscription.items.data[0]?.price.id;
    let plan = 'free';
    let pagesLimit = 10;

    if (priceId === 'price_1SCOTyCLn8BJ56M1w3fVfwn3') { // Starter plan
      plan = 'starter';
      pagesLimit = 300;
    } else if (priceId === 'price_1SCOTyCLn8BJ56M1bs7K4hGl') { // Professional plan
      plan = 'professional';
      pagesLimit = 1000;
    }

    // Upsert subscription
    const { error: subError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer,
        stripe_price_id: priceId,
        plan: plan,
        status: subscription.status,
        current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
        current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
        cancel_at: (subscription as any).cancel_at ? new Date((subscription as any).cancel_at * 1000).toISOString() : null,
        canceled_at: (subscription as any).canceled_at ? new Date((subscription as any).canceled_at * 1000).toISOString() : null,
        pages_limit: pagesLimit,
        amount: subscription.items.data[0]?.price.unit_amount || 0,
      }, {
        onConflict: 'stripe_subscription_id'
      });

    if (subError) {
      console.error('Error upserting subscription:', subError);
      return;
    }

    // Update user profile with new plan and limits
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        plan: plan,
        pages_limit: pagesLimit,
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Error updating profile:', profileError);
    }

    console.log(`Successfully updated subscription for user ${userId}: ${plan} plan`);
  } catch (error) {
    console.error('Error handling subscription change:', error);
  }
}

async function handleSubscriptionCancellation(subscription: Stripe.Subscription, supabase: any) {
  try {
    console.log('Handling subscription cancellation:', subscription.id);

    // Update subscription status
    const { error: subError } = await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id);

    if (subError) {
      console.error('Error updating canceled subscription:', subError);
      return;
    }

    // Get user ID from subscription
    const { data: subData } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (subData?.user_id) {
      // Revert user to free plan
      await supabase
        .from('profiles')
        .update({
          plan: 'free',
          pages_limit: 10,
        })
        .eq('id', subData.user_id);

      console.log(`Reverted user ${subData.user_id} to free plan`);
    }
  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
  }
}

async function handleSuccessfulPayment(invoice: Stripe.Invoice, supabase: any) {
  try {
    console.log('Handling successful payment for invoice:', invoice.id);

    if ((invoice as any).subscription) {
      // Update subscription status to active if it was past_due
      await supabase
        .from('subscriptions')
        .update({ status: 'active' })
        .eq('stripe_subscription_id', (invoice as any).subscription);
    }
  } catch (error) {
    console.error('Error handling successful payment:', error);
  }
}

async function handleFailedPayment(invoice: Stripe.Invoice, supabase: any) {
  try {
    console.log('Handling failed payment for invoice:', invoice.id);

    if ((invoice as any).subscription) {
      // Update subscription status to past_due
      await supabase
        .from('subscriptions')
        .update({ status: 'past_due' })
        .eq('stripe_subscription_id', (invoice as any).subscription);
    }
  } catch (error) {
    console.error('Error handling failed payment:', error);
  }
}