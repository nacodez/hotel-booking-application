# Firebase Configuration Guide

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name (e.g., "hotel-booking-system")
4. Enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Authentication

1. In Firebase Console, go to **Authentication** → **Get started**
2. Go to **Sign-in method** tab
3. Enable **Email/Password** provider
4. Click **Save**

## Step 3: Enable Firestore Database

1. Go to **Firestore Database** → **Create database**
2. Choose **Start in test mode** (for development)
3. Select your preferred location
4. Click **Done**

## Step 4: Get Firebase Configuration

### For Server (Admin SDK)
1. Go to **Project Settings** (gear icon) → **Service accounts**
2. Click **Generate new private key**
3. Download the JSON file
4. Extract the following values for your `.env` file:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=value-from-json
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nvalue-from-json\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=value-from-json
FIREBASE_CLIENT_ID=value-from-json
FIREBASE_CLIENT_X509_CERT_URL=value-from-json
```

### For Client (Web SDK)
1. Go to **Project Settings** → **General** tab
2. Scroll down to **Your apps** section
3. Click **Add app** → **Web app** (</> icon)
4. Enter app nickname and click **Register app**
5. Copy the config object values:

```env
FIREBASE_WEB_API_KEY=your-api-key
FIREBASE_WEB_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_WEB_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
FIREBASE_WEB_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_WEB_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_WEB_APP_ID=your-app-id
```

## Step 5: Update Environment Files

### Server Environment (`server/.env`)
Replace the demo values with your actual Firebase credentials:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-actual-project-id
FIREBASE_PRIVATE_KEY_ID=your-actual-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-actual-private-key\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=your-actual-client-email
FIREBASE_CLIENT_ID=your-actual-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=your-actual-cert-url

# Firebase Web Config (for client-side)
FIREBASE_WEB_API_KEY=your-actual-api-key
FIREBASE_WEB_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_WEB_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
FIREBASE_WEB_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_WEB_MESSAGING_SENDER_ID=your-actual-sender-id
FIREBASE_WEB_APP_ID=your-actual-app-id
```

### Client Environment
Update the client environment files with your Firebase web config.

## Step 6: Set Up Firestore Security Rules

1. Go to **Firestore Database** → **Rules** tab
2. Replace the default rules with production-ready rules (see `server/config/firestore.rules`)
3. Click **Publish**

## Step 7: Create First Admin User

After deploying, you'll need to manually create the first admin user in Firestore:

1. Go to **Firestore Database** → **Data** tab
2. Create a new collection called `users`
3. Add a document with your email as the document ID
4. Set the following fields:
   ```
   email: "your-email@example.com"
   role: "admin"
   isApproved: true
   createdAt: [current timestamp]
   ```

## Step 8: Deploy Firestore Rules and Indexes

```bash
# In the server directory
npm run deploy:rules
npm run deploy:indexes
```

## Development vs Production

- **Development**: Uses demo values and Firebase emulators
- **Production**: Uses real Firebase project credentials

The system automatically detects the environment based on the `FIREBASE_PROJECT_ID` value:
- `demo-project` = Development mode with emulators
- Any other value = Production mode with real Firebase

## Security Notes

- Never commit the `.env` file to version control
- Use environment variables in production deployments
- Regularly rotate your service account keys
- Set up proper Firestore security rules before going live