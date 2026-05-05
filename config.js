// قسم المتغيرات الأساسية للمشروع
const CONFIG = {
  // مفتاح API الخاص بموقع ImgBB لرفع الصور
  IMGBB_API_KEY: "7765600ba5d52e397d9eb90496cc46c6",
  
  // إعدادات قاعدة بيانات Firebase (يرجى وضع مفاتيح مشروعك هنا)
  FIREBASE_CONFIG: {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
  },
  
  // اسم المجموعة التي ستحفظ فيها المنتجات داخل Firestore
  COLLECTION_NAME: "products"
};

// تهيئة الاتصال بقاعدة بيانات Firebase
firebase.initializeApp(CONFIG.FIREBASE_CONFIG);
const db = firebase.firestore();
