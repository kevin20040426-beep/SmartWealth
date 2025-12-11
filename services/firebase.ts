// Import the functions you need from the SDKs you need
import firebase from "firebase/compat/app";
import "firebase/compat/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBnKAaJsfQdK75khAWw5s7eTe16K58MuRk",
  authDomain: "project-488128208390334691.firebaseapp.com",
  projectId: "project-488128208390334691",
  storageBucket: "project-488128208390334691.firebasestorage.app",
  messagingSenderId: "916786384920",
  appId: "1:916786384920:web:4f4c161bdee3844be2b36d",
  measurementId: "G-BRX1XML46T"
};

// Initialize Firebase
// Using compat initialization to bypass potential module resolution issues with "firebase/app"
export const app = firebase.initializeApp(firebaseConfig);
export const analytics = firebase.analytics();

// Use modular Auth and Firestore instances, binding to the default app initialized above
export const auth = getAuth();
export const db = getFirestore();
export const googleProvider = new GoogleAuthProvider();