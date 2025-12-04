import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDBtq3tq73R0B4C6oS3t1irILSp4kUNoyo",
  authDomain: "z-billing-7d3af.firebaseapp.com",
  projectId: "z-billing-7d3af",
  storageBucket: "z-billing-7d3af.firebasestorage.app",
  messagingSenderId: "908620861338",
  appId: "1:908620861338:web:6cf5a50cb73366bacc7423"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;