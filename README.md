# Où est le Poulet? 🐔

A real-time location-based hide-and-seek game built with React, TypeScript, Firebase, and Leaflet.

## Game Rules

1. **The Chicken** hides in a pub and creates a game
2. **Players** try to find the chicken using a shrinking search radius
3. Players join using a 6-digit room code
4. When the game starts, a circle is drawn around the chicken's location
5. The circle shrinks at configurable intervals
6. Players can only see the search circle, not the exact chicken location
7. The chicken can see all player locations in real-time
8. When a player finds the chicken, they mark themselves as "found"

## Features

✨ Real-time location tracking using Geolocation API  
🗺️ Interactive maps with Leaflet + OpenStreetMap  
🔥 Firebase Authentication & Firestore for real-time data  
📱 Mobile-responsive design  
🎮 Two distinct player roles: Chicken and Standard Player  
⚙️ Configurable game parameters:

- Initial search radius
- Shrink interval
- Shrink amount

## Prerequisites

- Node.js 16+ and npm
- A Firebase project (see setup instructions below)

## Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Authentication**:
   - Go to Authentication → Sign-in method
   - Enable "Email/Password" provider
4. Enable **Firestore Database**:
   - Go to Firestore Database → Create database
   - Start in **production mode**
   - Add these security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /games/{gameId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
                     (resource.data.chickenId == request.auth.uid || 
                      request.resource.data.status == resource.data.status);
      
      match /players/{playerId} {
        allow read: if request.auth != null;
        allow write: if request.auth != null;
      }
    }
  }
}
```

1. Get your Firebase configuration:
   - Go to Project Settings → General
   - Scroll to "Your apps" and click the web icon (</>)
   - Register your app and copy the config values

## Installation

1. Clone the repository:

```bash
cd ou_est_le_poulet
```

1. Install dependencies:

```bash
npm install
```

1. Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

1. Edit `.env.local` and add your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

## Running the Application

### Development Mode

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## How to Play

### As the Chicken 🐔

1. Sign up or log in
2. Choose "Be the Chicken"
3. Configure game parameters (radius, shrink interval, shrink amount)
4. Share the 6-digit game code with players
5. Wait for players to join
6. Click "Start Game" when ready
7. Watch as players try to find you on the map!

### As a Player 👤

1. Sign up or log in
2. Choose "Join as Player"
3. Enter the 6-digit game code from the chicken
4. Wait for the game to start
5. See the search circle on the map
6. Navigate to find the chicken before the circle shrinks!
7. Click "I Found the Chicken!" when you find them

## Project Structure

```
src/
├── components/        # Reusable components (GameMap)
├── contexts/          # React contexts (Auth, Game)
├── firebase/          # Firebase configuration
├── hooks/             # Custom hooks (useGeolocation)
├── pages/             # Page components (Login, RoleSelection, etc.)
├── types/             # TypeScript type definitions
├── utils/             # Helper functions (gameHelpers)
├── App.tsx            # Main app component with routing
├── main.tsx           # Entry point
└── index.css          # Global styles
```

## Technologies Used

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Firebase Authentication** - User authentication
- **Firestore** - Real-time database
- **React Router** - Client-side routing
- **React Leaflet** - Map components
- **Leaflet** - Interactive maps
- **OpenStreetMap** - Map tiles (free, no API key)

## Mobile Testing

For best results, test on actual mobile devices with GPS:

1. Deploy to Firebase Hosting or Vercel
2. Access from multiple mobile devices
3. Enable location permissions when prompted
4. Test in an outdoor environment for accurate GPS

## Troubleshooting

### Location not working

- Ensure location permissions are granted in browser settings
- HTTPS is required for geolocation (localhost works in dev)
- Try in an outdoor area for better GPS signal

### Firebase errors

- Double-check all environment variables in `.env.local`
- Ensure Firestore security rules are properly configured
- Check Firebase console for authentication and database status

### Game not updating in real-time

- Check internet connection
- Verify Firestore rules allow read/write access
- Check browser console for errors

## Future Enhancements

- [ ] Track money pot within the app
- [ ] Chat between players
- [ ] Game history and statistics
- [ ] Push notifications when circle shrinks
- [ ] Multiple game modes
- [ ] Leaderboards

## License

ISC

---

Built with ❤️ for pub crawlers everywhere 🍻
