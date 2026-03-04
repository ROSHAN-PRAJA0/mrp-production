import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD_IFyK6ya40H8SFdN44lqIecnZF14gOi0",
  authDomain: "mrp-automation.firebaseapp.com",
  projectId: "mrp-automation",
  storageBucket: "mrp-automation.firebasestorage.app",
  messagingSenderId: "392985441347",
  appId: "1:392985441347:web:45b26f32f815e70f03d0f6",
  measurementId: "G-REJFD11MGP"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
