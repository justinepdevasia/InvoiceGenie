import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'

function getResend() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not set')
  }
  return new Resend(apiKey)
}

export async function POST(request: NextRequest) {
  try {
    const { to, subject, type, data } = await request.json()

    // Verify user is authenticated
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resend = getResend()

    // Generate email content based on type
    let htmlContent = ''
    let textContent = ''
    const attachments: any[] = []

    switch (type) {
      case 'analysis_report':
        const { csvData, summaryStats, reportPeriod } = data

        htmlContent = generateAnalysisReportHTML({
          summaryStats,
          reportPeriod,
          recipientEmail: to
        })

        textContent = generateAnalysisReportText({
          summaryStats,
          reportPeriod
        })

        // Add CSV as attachment
        if (csvData) {
          attachments.push({
            filename: `expense-analysis-${new Date().toISOString().split('T')[0]}.csv`,
            content: Buffer.from(csvData),
            contentType: 'text/csv'
          })
        }
        break

      case 'invoice_processed':
        const { invoiceNumber, vendorName, amount, projectName } = data

        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Invoice Processed Successfully</h2>
            <p>Your invoice has been processed and added to your expense tracking system.</p>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Invoice Details:</h3>
              <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
              <p><strong>Vendor:</strong> ${vendorName}</p>
              <p><strong>Amount:</strong> $${amount}</p>
              <p><strong>Project:</strong> ${projectName}</p>
            </div>
            <p>You can view this invoice in your <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/invoices">dashboard</a>.</p>
          </div>
        `

        textContent = `Invoice Processed Successfully

Your invoice has been processed:
- Invoice Number: ${invoiceNumber}
- Vendor: ${vendorName}
- Amount: $${amount}
- Project: ${projectName}

View in dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/invoices`
        break

      case 'monthly_summary':
        const { totalSpending, transactionCount, topVendor, month } = data

        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Monthly Expense Summary - ${month}</h2>
            <p>Here's your expense summary for ${month}:</p>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Total Spending:</strong> $${totalSpending}</p>
              <p><strong>Total Transactions:</strong> ${transactionCount}</p>
              <p><strong>Top Vendor:</strong> ${topVendor}</p>
            </div>
            <p>View detailed analysis in your <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/analysis">dashboard</a>.</p>
          </div>
        `

        textContent = `Monthly Expense Summary - ${month}

Total Spending: $${totalSpending}
Total Transactions: ${transactionCount}
Top Vendor: ${topVendor}

View detailed analysis: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/analysis`
        break

      default:
        return NextResponse.json({ error: 'Invalid email type' }, { status: 400 })
    }

    // Send email
    const result = await resend.emails.send({
      from: 'Expensa <reports@expensa.app>',
      to: [to],
      subject,
      html: htmlContent,
      text: textContent,
      attachments: attachments.length > 0 ? attachments : undefined,
    })

    // Log email sent to database for tracking
    await supabase
      .from('email_logs')
      .insert({
        user_id: user.id,
        email_type: type,
        recipient: to,
        subject,
        status: 'sent',
        resend_id: result.data?.id,
        sent_at: new Date().toISOString()
      })

    return NextResponse.json({
      success: true,
      messageId: result.data?.id
    })

  } catch (error) {
    console.error('Email sending failed:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}

function generateAnalysisReportHTML({ summaryStats, reportPeriod, recipientEmail }: any) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Expense Analysis Report</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; border-bottom: 2px solid #e5e5e5; padding-bottom: 20px; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin: 0;">📊 Expense Analysis Report</h1>
        <p style="color: #666; margin: 10px 0 0 0;">Generated on ${new Date().toLocaleDateString()}</p>
      </div>

      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 10px; margin-bottom: 30px;">
        <h2 style="margin: 0 0 15px 0;">📈 Summary Statistics</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
          <div>
            <p style="margin: 5px 0;"><strong>Total Spending:</strong> $${summaryStats.totalSpending?.toFixed(2) || '0.00'}</p>
            <p style="margin: 5px 0;"><strong>Transactions:</strong> ${summaryStats.transactionCount || 0}</p>
            <p style="margin: 5px 0;"><strong>Average Transaction:</strong> $${summaryStats.averageTransaction?.toFixed(2) || '0.00'}</p>
          </div>
          <div>
            <p style="margin: 5px 0;"><strong>Tax Paid:</strong> $${summaryStats.taxPaid?.toFixed(2) || '0.00'}</p>
            <p style="margin: 5px 0;"><strong>Monthly Growth:</strong> ${summaryStats.monthlyGrowth?.toFixed(1) || '0.0'}%</p>
            <p style="margin: 5px 0;"><strong>Top Vendor:</strong> ${summaryStats.topVendor || 'N/A'}</p>
          </div>
        </div>
      </div>

      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <h3 style="color: #495057; margin-top: 0;">📋 Report Details</h3>
        <p><strong>Report Period:</strong> ${reportPeriod || 'All Time'}</p>
        <p><strong>Generated For:</strong> ${recipientEmail}</p>
        <p><strong>Report Type:</strong> Comprehensive Expense Analysis</p>
      </div>

      <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; border-left: 4px solid #2196f3;">
        <h3 style="color: #1976d2; margin-top: 0;">📎 Attached Files</h3>
        <p>This email includes a detailed CSV file with:</p>
        <ul style="margin: 10px 0;">
          <li>Individual transaction details</li>
          <li>Vendor analysis and categorization</li>
          <li>Spending forecasts and trends</li>
          <li>Summary statistics and insights</li>
        </ul>
        <p style="font-size: 14px; color: #666;">The CSV file can be opened in Excel, Google Sheets, or imported into accounting software.</p>
      </div>

      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5;">
        <p style="color: #666; font-size: 14px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/analysis" style="color: #2563eb; text-decoration: none;">View Interactive Analysis Dashboard</a>
        </p>
        <p style="color: #999; font-size: 12px; margin-top: 15px;">
          Generated by Expensa - Your AI-Powered Expense Management Platform<br>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color: #999;">expensa.app</a>
        </p>
      </div>
    </body>
    </html>
  `
}

function generateAnalysisReportText({ summaryStats, reportPeriod }: any) {
  return `
EXPENSE ANALYSIS REPORT
Generated on ${new Date().toLocaleDateString()}

SUMMARY STATISTICS
==================
Total Spending: $${summaryStats.totalSpending?.toFixed(2) || '0.00'}
Total Transactions: ${summaryStats.transactionCount || 0}
Average Transaction: $${summaryStats.averageTransaction?.toFixed(2) || '0.00'}
Tax Paid: $${summaryStats.taxPaid?.toFixed(2) || '0.00'}
Monthly Growth: ${summaryStats.monthlyGrowth?.toFixed(1) || '0.0'}%
Top Vendor: ${summaryStats.topVendor || 'N/A'}

REPORT DETAILS
==============
Report Period: ${reportPeriod || 'All Time'}
Report Type: Comprehensive Expense Analysis

ATTACHED FILES
==============
This email includes a detailed CSV file with individual transaction details,
vendor analysis, spending forecasts, and summary statistics.

View interactive dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/analysis

Generated by Expensa - Your AI-Powered Expense Management Platform
${process.env.NEXT_PUBLIC_APP_URL}
  `
}