<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/cf1e9a14-2cb8-4274-87f0-f910c75dd7e1

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Copy [.env.example](.env.example) to `.env.local`
3. Fill in the Firebase `VITE_*` values for your project
4. Run the app:
   `npm run dev`

## Firebase Setup (Required for Admin + Listings)

1. In Firebase Console, enable **Authentication** (Email/Password).
2. Create an admin account that matches the email/password you use on the admin login screen.
3. Enable **Firestore** and **Storage**.
4. Deploy rules:
   `firebase deploy --only firestore:rules,storage`

The admin panel uses Firebase Auth to sign in, Firestore to store products, and Storage for images. Public pages read products from Firestore; admin actions require an authenticated Firebase user.

## GitHub Pages Deployment

GitHub Pages builds this app through GitHub Actions. Add these repository secrets before deploying:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`
- `VITE_FUNCTIONS_REGION`
- `VITE_SMART_PLACEMENT_ENDPOINT` (optional)

Then in `Settings -> Pages`:

1. Set `Source` to `GitHub Actions`
2. Keep the custom domain configured there if needed
3. Let the `Deploy to GitHub Pages` workflow publish the `dist` output
