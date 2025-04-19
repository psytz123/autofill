# AutoFill Mobile App

This is the iOS mobile application for AutoFill, a fuel delivery service. This app allows users to:

- Order fuel delivery to their location
- Track deliveries in real-time
- Manage their vehicles
- View order history
- Manage payment methods

## Technology Stack

- React Native with Expo
- TypeScript
- React Navigation for routing
- RESTful API integration with the backend server

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Xcode) or an iOS device with Expo Go app

### Installation

1. Navigate to the mobile directory:
   ```
   cd mobile
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

4. For iOS:
   ```
   npm run ios
   ```
   
   This will open the app in the iOS Simulator if you have Xcode installed.

## Project Structure

```
mobile/
├── assets/                # Images, fonts, and other static assets
├── components/            # Reusable UI components
├── screens/               # Screen components for each route
├── utils/                 # Utility functions and helpers
│   ├── api.ts             # API client for backend communication
│   └── types.ts           # TypeScript type definitions
├── App.tsx                # Main application component
├── app.json               # Expo configuration
└── package.json           # Dependencies and scripts
```

## Connecting to the Backend

By default, the app connects to the backend at `http://localhost:5000/api`. For development on a physical device, you'll need to update the API_BASE_URL in `utils/api.ts` to point to your backend server's IP address or domain.

## Building for Production

To create a production build for iOS:

1. Configure app.json with your app's information
2. Create a production build:
   ```
   expo build:ios
   ```

This will guide you through the process of building an IPA file that can be submitted to the App Store.

## Features

- Authentication (login/register)
- Fuel ordering
- Real-time delivery tracking
- Vehicle management
- Payment processing
- Order history

## Planned Enhancements

- Push notifications for order updates
- Location sharing with delivery driver
- Fuel level estimation based on vehicle data
- Recurring scheduled deliveries