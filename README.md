# Calendar App

A SwiftUI iOS calendar application with a React Native (Expo) frontend.

## Running the Native iOS App in Xcode

The Xcode project (`CalendarApp.xcodeproj`) is included at the root of the repository.

### Prerequisites
- macOS with Xcode 15 or later installed
- An Apple Developer account (free account works for Simulator)

### Steps

1. Open the project in Xcode:
   ```bash
   open CalendarApp.xcodeproj
   ```
   Or double-click `CalendarApp.xcodeproj` in Finder.

2. Select a simulator or connected device from the toolbar.

3. Press **⌘R** (or click the Run ▶ button) to build and run the app.

> **Note:** All Swift source files (`*.swift`) are at the repository root and are referenced directly by the Xcode project — no additional setup needed.

## Running the React Native (Expo) Frontend

The Expo app lives in the `frontend/` directory.

### Prerequisites
- Node.js 18+ and Yarn or npm
- For iOS Simulator: Xcode installed on macOS

### Steps

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Start the development server:
   ```bash
   npx expo start
   ```

3. Press **i** to open in iOS Simulator, or scan the QR code with the Expo Go app on a physical device.

### Generating the native iOS project (for Xcode)

To open the React Native app in Xcode directly, run the Expo prebuild:

```bash
cd frontend
npx expo prebuild --platform ios
open ios/frontend.xcworkspace
```
