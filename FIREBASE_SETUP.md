# Firebase Setup Guide

## Quick Setup Steps

### 1. Create Firebase Project

1. Visit [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `ou-est-le-poulet` (or your preferred name)
4. Disable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Authentication

1. In Firebase Console, go to **Build** → **Authentication**
2. Click "Get started"
3. Click on **Sign-in method** tab
4. Click on "Email/Password"
5. Toggle **Enable** to ON
6. Click "Save"

### 3. Create Firestore Database

1. Go to **Build** → **Firestore Database**
2. Click "Create database"
3. Select **Start in production mode**
4. Choose a location (pick closest to your users)
5. Click "Enable"

### 4. Set Firestore Security Rules

1. In Firestore Database, click on **Rules** tab
2. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only authenticated users can access
    match /{document=**} {
      allow read, write: if false;
    }
    
    // Games collection
    match /games/{gameId} {
      // Anyone authenticated can read games
      allow read: if request.auth != null;
      
      // Only authenticated users can create games
      allow create: if request.auth != null;
      
      // Only the chicken can update game meta, anyone can update location
      allow update: if request.auth != null && 
                     (resource.data.chickenId == request.auth.uid || 
                      request.resource.data.status == resource.data.status);
      
      // Players subcollection
      match /players/{playerId} {
        // Any authenticated user can read players in a game
        allow read: if request.auth != null;
        
        // Users can write their own player data
        allow create, update: if request.auth != null && 
                                 playerId == request.auth.uid;
        
        // Players can delete themselves from a game
        allow delete: if request.auth != null && 
                         playerId == request.auth.uid;
      }
    }
  }
}
```

1. Click "Publish"

### 5. Get Firebase Configuration

1. In Firebase Console, click the **gear icon** (⚙️) → **Project settings**
2. Scroll down to "Your apps"
3. Click the **Web icon** (`</>`  code icon)
4. Register app:
   - App nickname: `ou-est-le-poulet-web`
   - Don't check Firebase Hosting
   - Click "Register app"
5. Copy the `firebaseConfig` object values

### 6. Configure Local Environment

1. In your project root, copy the example file:

   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and paste your Firebase config values:

   ```env
   VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXX
   VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
   VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
   ```

3. Save the file

### 7. Test the Setup

```bash
npm run dev
```

1. Open <http://localhost:3000>
2. Click "Sign Up"
3. Create a test account
4. If successful, you'll see the role selection screen!

## Firestore Data Structure

After setup, your Firestore will automatically create this structure:

```
games (collection)
  └── {gameId} (document)
      ├── gameCode: "123456"
      ├── chickenId: "user123"
      ├── chickenName: "John"
      ├── chickenLocation: { lat: 51.5074, lng: -0.1278 }
      ├── status: "active"
      ├── config: { initialRadius: 500, ... }
      ├── startTime: 1234567890
      ├── currentRadius: 450
      ├── createdAt: 1234567890
      └── players (subcollection)
          └── {playerId} (document)
              ├── userId: "user456"
              ├── displayName: "Jane"
              ├── location: { lat: 51.5074, lng: -0.1278 }
              ├── lastUpdated: 1234567890
              ├── foundChicken: false
              └── joinedAt: 1234567890
```

## Common Issues

### "Firebase: Error (auth/configuration-not-found)"

- Double-check your environment variables in `.env.local`
- Make sure you've enabled Email/Password authentication
- Restart the dev server after changing `.env.local`

### "Missing or insufficient permissions"

- Verify Firestore security rules are published
- Ensure you're logged in when accessing Firestore

### Environment variables not loading

- File must be named `.env.local` exactly
- Must be in the project root directory
- Restart dev server after creating/editing

## Production Deployment

When deploying to production:

1. **Do NOT commit `.env.local`** (it's in `.gitignore`)
2. Add environment variables to your hosting platform:
   - **Vercel**: Settings → Environment Variables
   - **Netlify**: Site settings → Build & deploy → Environment
   - **Firebase Hosting**: Add to `.env.production`

3. Update Firestore rules for production if needed

---

✅ You're all set! Happy chicken hunting! 🐔
