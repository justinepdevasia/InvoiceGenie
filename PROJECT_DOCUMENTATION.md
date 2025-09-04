# Invoice Genie - Project Documentation

## 📋 Project Overview

**Invoice Genie** is an AI-powered invoice processing platform that transforms PDFs, images, and multi-page invoices into structured data using intelligent OCR technology powered by Mistral AI.

### Key Features
- **Multi-format Support**: Process PDFs, JPG, PNG, and multi-page documents
- **AI-Powered OCR**: Mistral AI for accurate data extraction
- **Smart Filtering**: Advanced search and filter capabilities
- **CSV Export**: Export structured data for accounting software
- **Project Management**: Organize invoices by clients/vendors/periods
- **Secure Authentication**: User authentication with Supabase
- **Flexible Pricing**: Free tier + paid plans via Stripe

---

## 🛠 Technology Stack

### Frontend
- **Framework**: Next.js 15.5.2 with TypeScript
- **UI Library**: shadcn/ui (Radix UI + Tailwind CSS)
- **Styling**: Tailwind CSS v4
- **State Management**: React hooks
- **Forms**: react-hook-form with zod validation

### Backend
- **API**: Next.js App Router (server components)
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Payment Processing**: Stripe

### AI/ML
- **OCR Engine**: Mistral AI API
- **Document Processing**: pdf-lib, react-pdf

### DevOps & Deployment
- **Hosting**: Render.com
- **Database Host**: Supabase Cloud
- **Version Control**: GitHub
- **Environment**: Node.js

---

## 📊 Database Schema

### Core Tables

#### 1. **profiles** (extends auth.users)
```sql
- id (UUID, PK, FK → auth.users)
- email (TEXT, UNIQUE)
- full_name (TEXT)
- company (TEXT)
- stripe_customer_id (TEXT)
- subscription_status (TEXT)
- subscription_plan (TEXT)
- pages_used (INTEGER)
- pages_limit (INTEGER)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 2. **projects**
```sql
- id (UUID, PK)
- user_id (UUID, FK → profiles)
- name (TEXT)
- description (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 3. **invoices**
```sql
- id (UUID, PK)
- project_id (UUID, FK → projects)
- user_id (UUID, FK → profiles)
- original_file_url (TEXT)
- original_file_name (TEXT)
- file_type (TEXT)
- file_size (INTEGER)
- page_count (INTEGER)
- processing_status (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 4. **invoice_data** (OCR extracted data)
```sql
- id (UUID, PK)
- invoice_id (UUID, FK → invoices)
- invoice_number (TEXT)
- invoice_date (DATE)
- due_date (DATE)
- vendor_name (TEXT)
- vendor_address (TEXT)
- customer_name (TEXT)
- subtotal (DECIMAL)
- tax_amount (DECIMAL)
- total_amount (DECIMAL)
- currency (TEXT)
- raw_ocr_data (JSONB)
- confidence_score (DECIMAL)
- is_verified (BOOLEAN)
```

#### 5. **invoice_line_items**
```sql
- id (UUID, PK)
- invoice_data_id (UUID, FK → invoice_data)
- description (TEXT)
- quantity (DECIMAL)
- unit_price (DECIMAL)
- amount (DECIMAL)
```

#### 6. **subscription_plans**
```sql
- id (TEXT, PK)
- name (TEXT)
- price (DECIMAL)
- pages_per_month (INTEGER)
- features (JSONB)
- stripe_price_id (TEXT)
```

### Security
- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Automatic updated_at timestamps via triggers

---

## ✅ Implementation Status

### Completed Features ✅ (As of September 4, 2025)

1. **Project Setup**
   - Next.js with TypeScript configuration
   - Tailwind CSS and shadcn/ui integration
   - Project folder structure organized

2. **Supabase Integration**
   - Project created: `knigterdajbzzfduaobk`
   - Database URL: `https://knigterdajbzzfduaobk.supabase.co`
   - Full database schema implemented
   - RLS policies configured
   - Storage bucket for invoices created

3. **Authentication System**
   - Signup page with validation
   - Login page
   - Password requirements enforced
   - Session management via middleware
   - Protected routes

4. **UI Components**
   - Responsive landing page
   - Navigation bar
   - Pricing section
   - Features showcase
   - How-it-works guide
   - Footer with links

5. **Dashboard Structure**
   - Sidebar navigation
   - Dashboard layout
   - Overview page with stats
   - User menu with logout

6. **Project Management System**
   - Create/Edit/Delete projects
   - Project listing with search
   - Project details view
   - Invoice organization by project

7. **File Upload System**
   - Drag & drop interface
   - Multi-file upload support
   - Progress indicators
   - File validation (PDF/Images)
   - Supabase Storage integration

8. **Mistral AI OCR Integration**
   - OCR processing endpoint at `/api/ocr/process`
   - Pixtral-12b model for document analysis
   - Structured data extraction with JSON schema
   - Automatic invoice field detection
   - Line item extraction
   - Confidence scoring
   - Multi-page document support

9. **Invoice Data Management**
   - Complete invoice viewer at `/dashboard/invoices/[id]`
   - Side-by-side document preview and data editor
   - Edit mode for correcting OCR results
   - Line items management (add/edit/delete)
   - Automatic total calculation
   - Data verification status
   - Raw OCR data viewer
   - Confidence score display

10. **CSV Export Functionality**
    - API endpoint at `/api/export/csv`
    - Multiple export formats (summary, full, line items)
    - Project-level export
    - Individual invoice export
    - Properly escaped CSV values
    - Download with appropriate filenames

### Pending Features 📋

5. **Smart Filtering**
   - Advanced search
   - Date range filters
   - Status filters
   - Amount filters

6. **Stripe Integration**
   - Subscription management
   - Payment processing
   - Usage tracking
   - Billing portal

7. **Deployment**
   - GitHub repository setup
   - Render.com configuration
   - Environment variables
   - CI/CD pipeline

---

## 🔑 Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://knigterdajbzzfduaobk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[configured]
SUPABASE_SERVICE_ROLE_KEY=[to be configured]

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=[to be configured]
STRIPE_SECRET_KEY=[to be configured]
STRIPE_WEBHOOK_SECRET=[to be configured]

# Mistral AI
MISTRAL_API_KEY=[REQUIRED - Get from https://console.mistral.ai/]

# App
NEXT_PUBLIC_APP_URL=http://localhost:3002 (dev)
```

---

## 📁 Project Structure

```
InvoiceGenie/
├── app/                    # Next.js app router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx          # Landing page
│   ├── globals.css       # Global styles
│   ├── login/            # Login page
│   ├── signup/           # Signup page
│   └── dashboard/        # Dashboard pages
│       ├── layout.tsx    # Dashboard layout
│       └── page.tsx      # Dashboard overview
├── components/           # UI components
│   └── ui/              # shadcn/ui components
├── lib/                 # Utilities
│   ├── utils.ts        # Helper functions
│   └── supabase/       # Supabase clients
│       ├── client.ts   # Browser client
│       ├── server.ts   # Server client
│       └── middleware.ts # Auth middleware
├── public/             # Static assets
├── .env.local         # Environment variables
├── middleware.ts      # Next.js middleware
├── package.json       # Dependencies
└── tsconfig.json     # TypeScript config
```

---

## 🚀 Local Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Stripe account (for payments)
- Mistral AI API key (for OCR)

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd InvoiceGenie
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   - Copy `.env.example` to `.env.local`
   - Add your API keys and configuration

4. **Run development server**
   ```bash
   npm run dev
   ```
   Access at: http://localhost:3002

---

## 🔒 Security Considerations

1. **Authentication**
   - Email verification required
   - Strong password requirements
   - Session-based authentication
   - Secure cookie handling

2. **Data Protection**
   - Row Level Security (RLS) on all tables
   - User isolation
   - Encrypted connections
   - No sensitive data in client-side code

3. **File Security**
   - Private storage buckets
   - User-scoped file access
   - File type validation
   - Size limits enforced

4. **API Security**
   - Rate limiting (to be implemented)
   - Input validation
   - SQL injection protection
   - XSS prevention

---

## 📈 Pricing Tiers

| Plan | Price | Pages/Month | Features |
|------|-------|-------------|----------|
| **Free** | $0 | 10 | Basic OCR, 1 Project, CSV Export |
| **Starter** | $19 | 100 | All Free +, 5 Projects |
| **Pro** | $49 | 500 | All Starter +, Unlimited Projects, API Access, Priority Support |
| **Enterprise** | $149 | 2000 | All Pro +, Custom Integrations, Dedicated Support |

---

## 🧪 Testing

### Current Testing Status
- Manual testing via browser
- Playwright setup for E2E testing
- Authentication flow tested and working
- Signup creates user successfully
- Email confirmation required for login

### Known Issues
1. Email confirmation blocks immediate login after signup
2. Tailwind CSS v4 border utilities need adjustment
3. Some environment variables need production values

---

## 📝 Notes for Deployment

1. **Render.com Setup**
   - Use Web Service for Next.js app
   - Set build command: `npm run build`
   - Set start command: `npm start`
   - Configure environment variables

2. **Supabase Production**
   - Enable email provider for confirmations
   - Configure custom SMTP if needed
   - Set up database backups
   - Monitor usage limits

3. **Stripe Production**
   - Switch from test to live keys
   - Configure webhook endpoints
   - Set up customer portal
   - Test payment flows

4. **Security Checklist**
   - [ ] Enable HTTPS only
   - [ ] Set secure headers
   - [ ] Configure CORS properly
   - [ ] Enable rate limiting
   - [ ] Set up monitoring/alerts
   - [ ] Regular security audits

---

## 📞 Support & Contact

For development questions or issues:
- GitHub Issues: [to be configured]
- Documentation: This file
- Email: [to be configured]

---

*Last Updated: September 4, 2025*
*Version: 1.0.0-dev*