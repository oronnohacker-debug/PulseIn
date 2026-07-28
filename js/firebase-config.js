import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCPjBq74KCEgeO4MK6EZFjMuA3ju3s3Wpc",
  authDomain: "echoo-325d4.firebaseapp.com",
  projectId: "echoo-325d4",
  storageBucket: "echoo-325d4.firebasestorage.app",
  messagingSenderId: "694671555312",
  appId: "1:694671555312:web:12b3bdf72ff02943eba035"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);