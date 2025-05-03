# Task Reminder App

A modern, cross-platform task management application built with React Native and Expo. The app features a dark theme, priority-based task organization, and smooth animations.

## Features

- Create and manage tasks with different priority levels (Low, Medium, High)
- Mark tasks as complete/incomplete
- Dark theme with modern UI design
- Smooth animations and transitions
- Persistent storage using AsyncStorage
- Cross-platform support (iOS and Android)

## Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd TaskReminder
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Run on your preferred platform:
- Press `i` to run on iOS simulator
- Press `a` to run on Android emulator
- Scan the QR code with Expo Go app on your physical device

## Usage

1. **Adding a Task**
   - Tap the + button in the bottom right corner
   - Enter the task title
   - Select the priority level (Low, Medium, High)
   - Tap "Add Task"

2. **Managing Tasks**
   - Tap a task to mark it as complete/incomplete
   - Tasks are color-coded based on priority
   - Completed tasks are shown with a strikethrough

## Technologies Used

- React Native
- Expo
- TypeScript
- React Navigation
- React Native Paper
- AsyncStorage

## License

MIT 