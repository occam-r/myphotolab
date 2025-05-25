# My Photo Lab

## Overview

My Photo Lab is a feature-rich mobile application built with React Native and Expo that allows users to manage, view, and organize their photos with security to add or modify photo with a beautiful, interactive interface. The app provides a seamless photo viewing experience with customizable slideshow features, camera integration, and secure access through biometric authentication.

## Features

### Photo Management
- **Photo Gallery**: View your photos in a customizable carousel with multiple viewing modes
- **Drag-and-Drop Organization**: Rearrange photos with an intuitive drag-and-drop interface
- **Image Import**: Import images from your device's gallery
- **Camera Integration**: Take new photos directly within the app
- **Photo Deletion**: Easily remove unwanted photos from your collection

### Viewing Experience
- **Multiple Display Modes**: Choose between parallax, horizontal stack, or vertical stack viewing modes
- **Auto-Play Slideshow**: Set up automatic slideshows with customizable intervals
- **Looping Options**: Enable/disable looping for continuous viewing
- **Resize Modes**: Customize how images fit the screen (cover, contain, etc.)
- **Orientation Support**: Responsive design that adapts to both portrait and landscape orientations

### Security
- **Biometric Authentication**: Secure your photos with fingerprint or face recognition
- **Fallback App Pin Lock**: Secondary PIN-based authentication when biometrics are unavailable
- **App Screen Pinning Lock**: Prevents unauthorized access to other apps while viewing photos
- **Local Storage**: All photos are stored locally on your device for privacy

### User Experience
- **Gesture Controls**: Intuitive swipe and tap gestures for navigation
- **Responsive Design**: Adapts to different screen sizes and orientations
- **Keep Awake**: Prevents the screen from sleeping during slideshows
- **Caching**: Remembers your settings and photo arrangements

## Technology Stack

### Core Technologies
- **React Native (0.79.2)**: Cross-platform mobile framework
- **TypeScript (5.8.3)**: Type-safe JavaScript for robust code
- **Expo (53.0.9)**: Development platform for React Native

### Key Libraries
- **expo-camera (16.1.6)**: Camera functionality for taking photos
- **expo-image-picker (16.1.4)**: Integration with device photo gallery
- **expo-media-library (17.1.6)**: Access and save to device media library
- **expo-local-authentication (16.0.4)**: Biometric authentication
- **expo-file-system (18.1.9)**: File management capabilities
- **react-native-reanimated (3.17.4)**: Advanced animations
- **react-native-reanimated-carousel (4.0.2)**: Animated photo carousel
- **react-native-gesture-handler (2.24.0)**: Touch and gesture handling
- **react-native-sortables (1.6.0)**: Drag-and-drop functionality

## Project Structure

```
myphotolab/
├── assets/                # App icons and splash screens
├── src/
│   ├── components/        # Reusable UI components
│   ├── lib/               # Type definitions and interfaces
│   ├── reducer/           # State management with reducers
│   ├── screens/           # Main app screens
│   └── utils/             # Utility functions and helpers
├── app.json               # Expo configuration
└── package.json           # Dependencies and scripts
```

## Building the App in 2 Days

### Day 1: Setup and Core Functionality

1. **Project Initialization**:
   - Set up a new Expo project with TypeScript
   - Configure the project structure and navigation

2. **Core Components**:
   - Implement the Home screen with basic photo viewing
   - Create the image carousel component
   - Set up the camera integration

3. **State Management**:
   - Implement reducers for managing app state
   - Set up caching for persistent storage

### Day 2: Features and Polish

1. **Feature Completion**:
   - Add photo management functionality (add, delete, reorder)
   - Implement settings and customization options
   - Add biometric authentication

2. **UI/UX Refinement**:
   - Improve animations and transitions
   - Ensure responsive design for different orientations
   - Add gesture controls for intuitive navigation

3. **Testing and Deployment**:
   - Test on different devices and orientations
   - Fix bugs and optimize performance
   - Prepare for deployment with EAS Build

## Getting Started

### Prerequisites
- Node.js (LTS version)
- Yarn package manager
- Expo CLI
- iOS Simulator or Android Emulator (optional for development)

### Installation

```bash
# Clone the repository (if applicable)
git clone <repository-url>
cd myphotolab

# Install dependencies
yarn install

# Start the development server
yarn start
```

### Running on Device

```bash
# For Android
yarn android

# For iOS
yarn ios

# For web
yarn web
```

## Development Scripts

- `yarn start`: Start the Expo development server
- `yarn android`: Run on Android device/emulator
- `yarn ios`: Run on iOS simulator
- `yarn web`: Run in web browser
- `yarn lint`: Run ESLint to check code quality
- `yarn format`: Format code with Prettier

## License

This project is private and proprietary.

Fall Back
Here Image 
Time for hero Image
if time passed, retuyrjn to here image