// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCL6EkpCE9l_ahxKwvreTYbJBJ0GauXa4c",
  authDomain: "data-track-23254.firebaseapp.com",
  projectId: "data-track-23254",
  storageBucket: "data-track-23254.firebasestorage.app",
  messagingSenderId: "909992107147",
  appId: "1:909992107147:web:6fc88511c14519c6a1888e",
  measurementId: "G-DM0EKBQWE7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);