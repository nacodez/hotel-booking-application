# Hotel Booking System

A full-stack hotel booking app built with React and Node.js. Features real-time room availability, user authentication, and a complete booking workflow.

## What's Inside

This is a complete hotel booking platform with:
- **Frontend**: React app with room search, booking flow, and user dashboard
- **Backend**: Node.js API with Firebase integration
- **Database**: Firestore for storing rooms, bookings, and user data
- **Auth**: Firebase Authentication for user management

## Tech Stack

**Frontend**
- React 18 with Vite
- React Router for navigation
- Axios for API calls
- Firebase for authentication

**Backend**
- Node.js with Express
- Firebase Admin SDK
- JWT tokens for auth
- Joi for validation

**Database & Services**
- Firestore (NoSQL database)
- Firebase Auth
- Mailgun for emails

## Quick Start

### Prerequisites
- Node.js 18+
- Firebase project with Firestore enabled
- Git

### 1. Clone and Install
```bash
git clone <your-repo-url>
cd hotel-booking-app

# Install backend dependencies
cd server && npm install

# Install frontend dependencies  
cd ../client && npm install
```

### 2. Firebase Setup
1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Firestore Database
3. Enable Authentication (Email/Password provider)
4. Generate a service account key (Project Settings > Service Accounts)
5. Download the JSON key file

### 3. Environment Variables

**Backend** (create `server/.env.development`):
```env
NODE_ENV=development
PORT=5000
JWT_SECRET=your_long_random_secret_here
JWT_REFRESH_SECRET=your_long_refresh_secret_here
CLIENT_URL=http://localhost:3000

# Firebase (from your service account JSON)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# Email (optional - for booking confirmations)
EMAIL_SERVICE=smtp
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=your-mailgun-user
EMAIL_PASSWORD=your-mailgun-password
EMAIL_FROM=noreply@yourdomain.com
```

**Frontend** (create `client/.env.development`):
```env
VITE_APP_NAME=Hotel Booking System
VITE_APP_ENVIRONMENT=development
VITE_API_BASE_URL=http://localhost:5000/api

# Firebase (from your Firebase project settings)
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

### 4. Run the App
```bash
# Start backend (from server folder)
npm run dev

# Start frontend (from client folder) 
npm run dev
```

Backend runs on `http://localhost:5000`  
Frontend runs on `http://localhost:3000`

## Project Structure

```
hotel-booking-app/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API calls
│   │   └── styles/        # CSS files
│   └── package.json
├── server/                 # Node.js backend
│   ├── controllers/        # Route handlers
│   ├── middleware/        # Express middleware
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   └── package.json
└── README.md
```

## Development Workflow

### Adding Sample Data
The app needs some initial room data to work with. You can add rooms through the API or directly in Firestore.

Example room document structure:
```javascript
{
  name: "Deluxe Ocean View",
  type: "deluxe", 
  price: 299,
  capacity: 2,
  available: true,
  roomStatus: "available",
  images: ["room1.jpg"],
  amenities: ["WiFi", "TV", "AC"],
  description: "Beautiful ocean view room..."
}
```

### Common Development Tasks

**Clean install**:
```bash
rm -rf node_modules package-lock.json
npm install
```

**Reset Firestore data**:
```bash
# From server folder
firebase firestore:delete --all-collections
```

**Check Firebase connection**:
```bash
firebase projects:list
```

## Deployment

### Option 1: Netlify + Railway
This is the easiest deployment setup.

**Frontend (Netlify)**:
1. Connect your GitHub repo to Netlify
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add environment variables in Netlify dashboard

**Backend (Railway)**:
1. Connect your GitHub repo to Railway
2. Add environment variables in Railway dashboard
3. Auto-deploys on push to main

### Option 2: Docker
```bash
docker-compose up --build
```

## Environment Setup for Production

**Update these files for production**:

`server/.env.production`:
```env
NODE_ENV=production
CLIENT_URL=https://your-netlify-app.netlify.app
# ... other production values
```

`client/.env.production`:
```env
VITE_API_BASE_URL=https://your-railway-app.railway.app/api
# ... other production values
```

## Troubleshooting

**Firebase connection errors**:
- Double-check your service account JSON formatting
- Make sure Firestore is enabled in Firebase console
- Verify project ID matches in both frontend/backend configs

**CORS errors**:
- Check `CLIENT_URL` in backend environment
- Verify API base URL in frontend environment

**Build fails**:
- Clear node_modules and reinstall
- Check for missing environment variables
- Make sure Firebase config is correct

**Booking flow issues**:
- Verify room documents have `available: true` and `roomStatus: "available"`
- Check Firestore security rules allow authenticated users to read/write

## API Endpoints

**Auth**:
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Sign in
- `GET /api/auth/verify` - Check token

**Rooms**:
- `POST /api/rooms/search` - Search available rooms
- `GET /api/rooms/:id` - Get room details

**Bookings**:
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - Get user's bookings
- `DELETE /api/bookings/:id/cancel` - Cancel booking

## Firebase Security Rules

Basic Firestore rules are included in `server/firestore.rules`. Deploy them with:
```bash
cd server
firebase deploy --only firestore:rules
```

## Contributing

1. Fork the repo
2. Create a feature branch
3. Make your changes  
4. Test locally
5. Submit a pull request

## License

MIT License - see LICENSE file for details.