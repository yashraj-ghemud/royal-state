# 🏠 RentEasy - Room Rental Application

A modern, full-stack room rental application built with React + Vite and Firebase.

## 🚀 Features

- **Video Background Landing Page** - Eye-catching homepage with scroll animations
- **Smart Login System** - Role-based authentication (Admin/Customer)
- **Admin Dashboard** - Post rooms with images, manage listings
- **Customer Explore Page** - Browse rooms with filters and real-time updates
- **Direct Call Feature** - One-click call to room owners
- **Real-time Database** - Live updates using Firebase Firestore

## 📁 Project Structure

```
my-rental-app/
├── public/
│   └── bg.mp4              # Background video (add your own)
├── src/
│   ├── config/
│   │   └── firebaseConfig.js
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── components/
│   │   └── ProtectedRoute.jsx
│   ├── pages/
│   │   ├── Home/
│   │   │   ├── Home.jsx
│   │   │   └── Home.css
│   │   ├── Auth/
│   │   │   ├── Auth.jsx
│   │   │   └── Auth.css
│   │   ├── AdminDashboard/
│   │   │   ├── AdminDashboard.jsx
│   │   │   └── AdminDashboard.css
│   │   └── ExploreRooms/
│   │       ├── ExploreRooms.jsx
│   │       └── ExploreRooms.css
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
├── package.json
└── README.md
```

## 🛠️ Setup Instructions

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Authentication** → Email/Password
4. Enable **Firestore Database**
5. Enable **Storage**
6. Get your config from Project Settings → Web App

### 2. Add Firebase Config

Edit `src/config/firebaseConfig.js`:

```javascript
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 3. Add Background Video

Place your `bg.mp4` video file in the `public/` folder.

### 4. Firestore Security Rules

In Firebase Console → Firestore → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Rooms collection
    match /rooms/{roomId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        request.auth.uid == resource.data.ownerId;
    }
  }
}
```

### 5. Storage Rules

In Firebase Console → Storage → Rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /rooms/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### 6. Run the App

```bash
npm install
npm run dev
```

## 🌐 Deployment (Netlify)

### Method 1: GitHub + Netlify

1. Push code to GitHub
2. Go to [Netlify](https://netlify.com)
3. Click "New Site from Git"
4. Select your GitHub repo
5. Build command: `npm run build`
6. Publish directory: `dist`
7. Click "Deploy"

### Method 2: Netlify CLI

```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```

## 📱 User Flow

### For Room Seekers (Customers):
1. Sign up as "Room Seeker"
2. Browse available rooms
3. Filter by type (PG, 1BHK, etc.)
4. Click on room to see details
5. Call owner directly

### For Room Owners (Admins):
1. Sign up as "Room Owner"
2. Access Admin Dashboard
3. Post new rooms with images
4. Manage/delete listings
5. Track total posts

## 🔧 Tech Stack

- **Frontend**: React + Vite
- **Styling**: CSS3 with Glassmorphism
- **Animations**: Framer Motion
- **Routing**: React Router DOM
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Deployment**: Netlify

## 📞 Contact Button Code

```jsx
<a href={`tel:${room.phone}`}>Call Now</a>
```

## 🎨 Customization

- Change colors in CSS files (primary gradient: `#667eea` to `#764ba2`)
- Replace `bg.mp4` with your own video
- Edit text content in Home.jsx
- Modify room types in AdminDashboard.jsx

## 📄 License

MIT License - Feel free to use for personal and commercial projects.

---

Made with ❤️ for RentEasy

