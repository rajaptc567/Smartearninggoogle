import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// --- IMPORTANT ---
// To get your own live version of this app running, you need to:
// 1. Create a project at https://console.firebase.google.com/
// 2. In your project settings, find your web app's configuration.
// 3. Copy the config object and paste its values here.
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA9Epue5MGtFuQlNT6GsTINgPW31UABMXM",
  authDomain: "smartearning-a450d.firebaseapp.com",
  databaseURL: "https://smartearning-a450d-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "smartearning-a450d",
  storageBucket: "smartearning-a450d.appspot.com",
  messagingSenderId: "116141221051",
  appId: "1:116141221051:web:d8f6c2bc7594942d11f59e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firestore database instance
export const db = getFirestore(app);

// Get Firebase auth instance
export const auth = getAuth(app);
