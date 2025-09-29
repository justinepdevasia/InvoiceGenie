# Expensa Mobile App

React Native mobile application for expense management and document scanning.

## Features

- 📱 Cross-platform (iOS & Android) support via React Native & Expo
- 📷 Document scanning with camera integration
- 🔐 Secure authentication with Supabase
- 📊 Real-time expense analytics and insights
- 📁 Project-based organization
- 🌙 Dark/Light theme support
- 📡 Offline support (coming soon)
- 🔄 Real-time sync with web app

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation v6
- **State Management**: React Query + Context API
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Camera**: Expo Camera
- **Styling**: React Native StyleSheet with custom theming
- **TypeScript**: Full type safety

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development)
- Android Studio & Android Emulator (for Android development)

### Installation

1. Navigate to the mobile app directory:
```bash
cd apps/mobile
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

4. Start the development server:
```bash
npm start
```

5. Run on device/emulator:
- iOS: Press `i` in the terminal or scan QR code with Camera app
- Android: Press `a` in the terminal or scan QR code with Expo Go app

## Environment Variables

Create a `.env` file in the `apps/mobile` directory:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_API_URL=http://localhost:3000
```

## Project Structure

```
apps/mobile/
├── src/
│   ├── components/          # Reusable UI components
│   ├── contexts/           # React contexts (Auth, Theme)
│   ├── hooks/              # Custom React hooks
│   ├── navigation/         # Navigation configuration
│   ├── screens/            # Screen components
│   │   ├── auth/          # Authentication screens
│   │   ├── main/          # Main app screens
│   │   └── camera/        # Camera/scanning screens
│   ├── services/          # API services
│   └── utils/             # Utility functions
├── assets/                # Images, icons, fonts
├── App.tsx               # Root component
└── app.json              # Expo configuration
```

## Key Features Implementation

### Authentication
- Supabase Auth integration
- Email/password authentication
- Persistent sessions
- Automatic token refresh

### Document Scanning
- Camera permissions handling
- High-quality image capture
- Base64 encoding for API upload
- OCR processing via web API
- Progress feedback

### Navigation
- Stack navigation for main flow
- Tab navigation for main screens
- Modal presentation for camera
- Type-safe navigation with TypeScript

### State Management
- React Query for server state
- Context API for app state
- Automatic caching and background updates
- Optimistic updates

### Theming
- Dynamic theme switching
- Consistent design system
- Platform-specific styling
- Accessibility support

## Available Scripts

- `npm start` - Start Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS simulator
- `npm run web` - Run in web browser (limited functionality)

## Building for Production

### Development Build
```bash
eas build --platform all --profile development
```

### Production Build
```bash
eas build --platform all --profile production
```

### App Store Submission
```bash
eas submit --platform ios
eas submit --platform android
```

## Shared Code with Web App

This mobile app shares code with the web application via the monorepo structure:

- `packages/shared-types/` - TypeScript interfaces and types
- `packages/shared-utils/` - Utility functions and helpers
- `packages/shared-api-client/` - API client and services

## API Integration

The mobile app connects to the same API endpoints as the web app:

- `/api/auth/*` - Authentication endpoints
- `/api/ocr/process` - Document processing
- `/api/projects/*` - Project management
- `/api/invoices/*` - Invoice management

## Permissions Required

### iOS (Info.plist)
```xml
<key>NSCameraUsageDescription</key>
<string>Camera access is required to scan documents and receipts</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Photo library access is required to save scanned documents</string>
```

### Android (app.json)
```json
{
  "expo": {
    "plugins": [
      [
        "expo-camera",
        {
          "cameraPermission": "Allow $(PRODUCT_NAME) to access your camera to scan documents."
        }
      ]
    ]
  }
}
```

## Performance Optimizations

- Image compression before upload
- Lazy loading of screens
- Optimized list rendering with FlatList
- Background sync for offline support
- Memory management for large images

## Development Guidelines

### Code Style
- Use TypeScript for all components
- Follow React Native best practices
- Implement proper error boundaries
- Use meaningful component names
- Add proper type annotations

### Testing
- Unit tests for utility functions
- Integration tests for API calls
- E2E tests for critical user flows
- Performance testing for camera features

### Security
- Secure storage for sensitive data
- Certificate pinning for API calls
- Biometric authentication (planned)
- Data encryption at rest

## Troubleshooting

### Common Issues

1. **Metro bundler issues**: Clear cache with `npx expo start -c`
2. **Camera not working**: Check permissions in device settings
3. **API connection fails**: Verify API_URL and network connectivity
4. **Build failures**: Check Expo CLI version and dependencies

### Debug Mode
```bash
npx expo start --dev-client
```

## Contributing

1. Follow the existing code structure
2. Add proper TypeScript types
3. Test on both iOS and Android
4. Update documentation for new features
5. Follow the established design patterns

## Roadmap

- [ ] Push notifications for processing updates
- [ ] Offline mode with local database
- [ ] Biometric authentication
- [ ] Apple Pay / Google Pay integration
- [ ] Document templates and automation
- [ ] Advanced analytics and reporting
- [ ] Multi-language support
- [ ] Widget support

## License

Private - Expensa Mobile App