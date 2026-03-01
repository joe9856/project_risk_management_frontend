// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAau8BKxTDdm8gBLtLJpQetpfEarurPAfo",
  authDomain: "riskcalculator-ed7e1.firebaseapp.com",
  projectId: "riskcalculator-ed7e1",
  storageBucket: "riskcalculator-ed7e1.firebasestorage.app",
  messagingSenderId: "835109432160",
  appId: "1:835109432160:web:3fd9edbdb1e44b20c30c05",
  measurementId: "G-4VGM8GVK25"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);