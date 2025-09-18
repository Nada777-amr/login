// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB82FcvM-paHfnX_7b4dmnYBvcG06RYntg",
  authDomain: "login-e2288.firebaseapp.com",
  projectId: "login-e2288",
  storageBucket: "login-e2288.firebasestorage.app",
  messagingSenderId: "1021650772463",
  appId: "1:1021650772463:web:23b64050e3bd77d5b6561a",
  measurementId: "G-Q12PYZYJGY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Analytics only on client side
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;