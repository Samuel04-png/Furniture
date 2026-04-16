<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/cf1e9a14-2cb8-4274-87f0-f910c75dd7e1

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Firebase Setup (Required for Admin + Listings)

1. In Firebase Console, enable **Authentication** (Email/Password).
2. Create an admin account that matches the email/password you use on the admin login screen.
3. Enable **Firestore** and **Storage**.
4. Deploy rules:
   `firebase deploy --only firestore:rules,storage`

The admin panel uses Firebase Auth to sign in, Firestore to store products, and Storage for images. Public pages read products from Firestore; admin actions require an authenticated Firebase user.
