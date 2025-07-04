// Import the Firebase modules
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your Firebase configuration details
const firebaseConfig = {
  apiKey: "AIzaSyBJw2pLgU0JpX-IMcljDbepfHs-DjvPHFk",
  authDomain: "Yecomm-f3af0.firebaseapp.com",
  projectId: "ecomm-f3af0",
  storageBucket: "ecomm-f3af0.firebasestorage.app",
  messagingSenderId: "1002224977426",
  appId: "1:1002224977426:web:53ab7d5e128118aab03acb",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase Auth
export const auth = getAuth(app);