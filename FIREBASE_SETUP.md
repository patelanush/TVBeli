# TVBeli cloud setup

Use Node 22 for local builds and Vercel. Running the optional Firestore rules emulator (`npm run test:rules`) also requires Java 21 or newer.

1. Create a Firebase project and register a Web app.
2. In **Authentication > Sign-in method**, enable Google.
3. In **Firestore Database**, create a production database.
4. Copy `.env.example` to `.env.local` and paste the Firebase Web app values.
5. Copy your account UID from **Authentication > Users**.
6. Put the UID in `EXPO_PUBLIC_FIREBASE_OWNER_UID` and ensure `firestore.rules` authorizes that same UID.
7. Run `npx firebase login`, `npx firebase use YOUR_PROJECT_ID`, then `npm run deploy:rules`.
8. Add the same public Firebase variables to Vercel. Add `TMDB_READ_ACCESS_TOKEN` to Vercel as a server-only variable.
9. In Firebase Authentication settings, add the Vercel production domain to **Authorized domains**.

TVBeli proxies `/__/auth/*` to the Firebase Hosting auth helper so mobile redirect sign-in remains same-origin on browsers such as iPhone Safari. Keep that Vercel rewrite and the authorized production domain in place.

Do not commit `.env.local`. Firebase Web configuration is public by design; the owner UID and Firestore rules provide the application authorization boundary. The TMDB token stays server-side.
