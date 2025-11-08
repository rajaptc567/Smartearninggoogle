import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// --- IMPORTANT ---
// To get your own live version of this app running, you need to:
// 1. Create a project at https://console.firebase.google.com/
// 2. In your project settings, find your web app's configuration.
// 3. Copy the config object and paste its values here.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY", // PASTE YOURS HERE
  authDomain: "YOUR_AUTH_DOMAIN", // PASTE YOURS HERE
  projectId: "YOUR_PROJECT_ID", // PASTE YOURS HERE
  storageBucket: "YOUR_STORAGE_BUCKET", // PASTE YOURS HERE
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // PASTE YOURS HERE
  appId: "YOUR_APP_ID" // PASTE YOURS HERE
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firestore database instance
export const db = getFirestore(app);

// Get Firebase auth instance
export const auth = getAuth(app);
