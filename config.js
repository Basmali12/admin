const CONFIG = {
  IMGBB_API_KEY: "7765600ba5d52e397d9eb90496cc46c6",
  FIREBASE_CONFIG: {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
  },
  COLLECTION_NAME: "products"
};

firebase.initializeApp(CONFIG.FIREBASE_CONFIG);
const db = firebase.firestore();
