// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {getFirestore} from "firebase/firestore";
import {getStorage} from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBDcfvEgqitApgAmDrJVKoaj30vgrzmstg",
  authDomain: "medspace-52ce8.firebaseapp.com",
  projectId: "medspace-52ce8",
  storageBucket: "medspace-52ce8.firebasestorage.app",
  messagingSenderId: "678170586598",
  appId: "1:678170586598:web:49ba472ddcf99072a47a27",
  measurementId: "G-L54NZ6MQMG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);