// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);