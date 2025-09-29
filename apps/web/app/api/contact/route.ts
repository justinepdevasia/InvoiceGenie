import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, company, subject, message } = body

    // Validate required fields
    if (!name || !email || !message || !subject) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Store contact form submission in database
    const { data, error } = await supabase
      .from('contact_submissions')
      .insert({
        name,
        email,
        company: company || null,
        subject,
        message,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Contact form submission error:', error)
      
      // If table doesn't exist, create it first
      if (error.code === '42P01') {
        // Create the contact_submissions table
        const { error: createError } = await supabase.rpc('create_contact_submissions_table', {
          sql: `
            CREATE TABLE IF NOT EXISTS contact_submissions (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              name TEXT NOT NULL,
              email TEXT NOT NULL,
              company TEXT,
              subject TEXT NOT NULL,
              message TEXT NOT NULL,
              status TEXT DEFAULT 'pending',
              created_at TIMESTAMP DEFAULT NOW(),
              responded_at TIMESTAMP,
              response_notes TEXT
            );
            
            -- Enable RLS
            ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
            
            -- Create policy for inserting (anyone can submit)
            CREATE POLICY "Anyone can submit contact form" ON contact_submissions
              FOR INSERT WITH CHECK (true);
            
            -- Create policy for viewing (only admins)
            CREATE POLICY "Only admins can view submissions" ON contact_submissions
              FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');
          `
        })

        if (createError) {
          console.error('Failed to create table:', createError)
        } else {
          // Retry the insert
          const { data: retryData, error: retryError } = await supabase
            .from('contact_submissions')
            .insert({
              name,
              email,
              company: company || null,
              subject,
              message,
              status: 'pending'
            })
            .select()
            .single()

          if (retryError) {
            throw retryError
          }

          return NextResponse.json(
            { 
              success: true, 
              message: 'Thank you for your message. We will get back to you soon!',
              data: retryData 
            },
            { status: 200 }
          )
        }
      }
      
      throw error
    }

    // Send email notification (in production, you'd use a service like SendGrid)
    if (process.env.ADMIN_EMAIL) {
      // await sendEmailNotification({
      //   to: process.env.ADMIN_EMAIL,
      //   subject: `New Contact Form Submission - ${subject}`,
      //   html: `
      //     <h2>New Contact Form Submission</h2>
      //     <p><strong>Name:</strong> ${name}</p>
      //     <p><strong>Email:</strong> ${email}</p>
      //     <p><strong>Company:</strong> ${company || 'N/A'}</p>
      //     <p><strong>Subject:</strong> ${subject}</p>
      //     <p><strong>Message:</strong></p>
      //     <p>${message}</p>
      //   `
      // })
    }

    // Send auto-reply to user
    // await sendEmailNotification({
    //   to: email,
    //   subject: 'Thank you for contacting Invoice Genie',
    //   html: `
    //     <h2>Thank you for reaching out!</h2>
    //     <p>Hi ${name},</p>
    //     <p>We've received your message and will get back to you within 24 hours.</p>
    //     <p>If you need immediate assistance, please check our <a href="https://invoicegenie.com/help">Help Center</a>.</p>
    //     <p>Best regards,<br/>The Invoice Genie Team</p>
    //   `
    // })

    return NextResponse.json(
      { 
        success: true, 
        message: 'Thank you for your message. We will get back to you soon!',
        data 
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Failed to submit contact form. Please try again.' },
      { status: 500 }
    )
  }
}