# Expensa - Intelligent Expense Management Platform

A comprehensive expense management solution with OCR-powered document processing, analytics, and cross-platform availability.

## 📱 Platform Availability

- **Web Application**: Full-featured dashboard with advanced analytics
- **Mobile App**: React Native app for iOS and Android with camera scanning

## 🚀 Features

### Core Features
- 📄 **OCR Document Processing**: Automated invoice and receipt data extraction
- 📊 **Advanced Analytics**: Comprehensive expense insights and reporting
- 📁 **Project Organization**: Organize expenses by projects and categories
- 💳 **Subscription Management**: Stripe-powered billing and subscription tiers
- 📧 **Automated Reporting**: Email reports with CSV exports
- 🔐 **Secure Authentication**: Supabase Auth with Row Level Security

### Mobile-Specific Features
- 📷 **Camera Scanning**: Native document scanning with real-time processing
- 🔄 **Offline Support**: Work offline and sync when connected (coming soon)
- 📱 **Push Notifications**: Real-time processing updates
- 🎨 **Native UI**: Platform-specific design and interactions

## 🏗️ Architecture

### Monorepo Structure
```
InvoiceGenie/
├── apps/
│   ├── web/                 # Next.js web application
│   └── mobile/              # React Native mobile app
├── packages/
│   ├── shared-types/        # TypeScript interfaces
│   ├── shared-utils/        # Business logic functions
│   └── shared-api-client/   # API calling logic
└── supabase/               # Database migrations
```

### Tech Stack

#### Web Application
- **Framework**: Next.js 15 with App Router
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payments**: Stripe
- **Email**: Resend
- **OCR**: Mistral AI OCR & Vision API
- **UI**: Tailwind CSS + shadcn/ui
- **Charts**: Recharts

#### Mobile Application
- **Framework**: React Native with Expo
- **Navigation**: React Navigation v6
- **State Management**: React Query + Context API
- **Camera**: Expo Camera
- **Styling**: Custom theming system

#### Shared Infrastructure
- **Language**: TypeScript throughout
- **State Management**: React Query
- **API**: RESTful endpoints with type safety
- **File Storage**: Supabase Storage
- **Real-time**: Supabase Realtime

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Stripe account (for payments)
- Mistral AI API key (for OCR)

### Web Application Setup

1. **Clone and install**:
```bash
git clone <repository-url>
cd InvoiceGenie
npm install
```

2. **Set up environment variables**:
```bash
cp apps/web/.env.example apps/web/.env.local
# Edit with your API keys and configuration
```

3. **Run the development server**:
```bash
npm run dev:web
```

4. **Access the application**:
Open [http://localhost:3000](http://localhost:3000)

### Mobile Application Setup

1. **Install Expo CLI**:
```bash
npm install -g @expo/cli
```

2. **Set up mobile environment**:
```bash
cp apps/mobile/.env.example apps/mobile/.env
# Edit with your configuration
```

3. **Start the mobile development server**:
```bash
npm run dev:mobile
```

4. **Run on device**:
- iOS: Open Camera app and scan QR code
- Android: Use Expo Go app to scan QR code

## 📊 Key Features Deep Dive

### OCR Processing
- **Mistral OCR API**: High-accuracy document text extraction
- **Structured Data**: JSON schema-based data extraction
- **Fallback Processing**: Vision model backup for complex documents
- **Multi-format Support**: PDF, JPEG, PNG, WebP

### Analytics Dashboard
- **Expense Trends**: Monthly/yearly expense tracking
- **Vendor Analysis**: Top vendors and spending patterns
- **Project Insights**: Project-based expense breakdown
- **Custom Exports**: CSV export with comprehensive data

### Mobile Scanning
- **Real-time Preview**: Live camera preview with document detection
- **Quality Optimization**: Automatic image enhancement
- **Batch Processing**: Multiple document scanning sessions
- **Progress Tracking**: Real-time processing status updates

## 🔧 Development

### Running Both Applications
```bash
# Start web and mobile in parallel
npm run dev:web &
npm run dev:mobile &
```

### Testing
```bash
# Run web application tests
npm run test:web

# Run mobile application tests
npm run test:mobile
```

### Building for Production

#### Web Application
```bash
npm run build:web
```

#### Mobile Application
```bash
# Development build
eas build --platform all --profile development

# Production build
eas build --platform all --profile production
```

## 📱 Mobile App Distribution

### iOS App Store
1. Apple Developer Account ($99/year)
2. Build with EAS Build
3. Submit via EAS Submit or App Store Connect

### Google Play Store
1. Google Play Developer Account ($25 one-time)
2. Build with EAS Build
3. Submit via EAS Submit or Play Console

## 🔒 Security

### Authentication
- Supabase Auth with email/password
- Row Level Security (RLS) policies
- JWT tokens with automatic refresh
- Secure session management

### Data Protection
- Encrypted database connections
- Secure file storage
- API key rotation
- GDPR compliance ready

### API Security
- Rate limiting
- Request validation
- CORS configuration
- Secure headers

## 📈 Usage Limits & Pricing

### Free Tier
- 10 documents per month
- Basic analytics
- Email support

### Premium Tier ($9.99/month)
- Unlimited documents
- Advanced analytics
- Priority support
- Export features
- Mobile app access

## 🚀 Deployment

### Web Application (Vercel)
```bash
# Deploy to Vercel
vercel --prod
```

### Mobile Application (EAS)
```bash
# Configure EAS
eas build:configure

# Build and submit
eas build --platform all
eas submit --platform all
```

## 📊 Monitoring & Analytics

- **Error Tracking**: Sentry integration
- **Performance**: Web Vitals and mobile performance metrics
- **Usage Analytics**: User behavior and feature adoption
- **Business Metrics**: Subscription and revenue tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

### Development Workflow
1. Web changes: Test on localhost:3000
2. Mobile changes: Test on iOS Simulator and Android emulator
3. Shared package changes: Test in both applications
4. Database changes: Create migrations in Supabase

## 📄 License

Private - Expensa Platform

## 🆘 Support

- **Documentation**: [docs.expensa.app](docs.expensa.app) (coming soon)
- **Email**: support@expensa.app
- **GitHub Issues**: For bug reports and feature requests

## 🗺️ Roadmap

### Phase 1 (Completed)
- ✅ Web application with OCR
- ✅ Mobile app with camera scanning
- ✅ Basic analytics
- ✅ Stripe integration

### Phase 2 (In Progress)
- 🔄 Advanced analytics
- 🔄 Improved mobile UI
- 🔄 Push notifications
- 🔄 Offline support

### Phase 3 (Planned)
- 📋 Receipt templates
- 🤖 AI-powered categorization
- 🔗 Bank account integration
- 📊 Advanced reporting
- 🌍 Multi-language support

## 📞 Contact

For questions about this implementation or to discuss custom features:

- **Email**: contact@expensa.app
- **Website**: [expensa.app](https://expensa.app)
- **Twitter**: [@ExpensaApp](https://twitter.com/ExpensaApp)

---

Built with ❤️ using modern web and mobile technologies.