/* =========================================================
   إعدادات Firebase — للمصادقة الحقيقية (خوادم Google)
   =========================================================
   خطوات الإعداد (5 دقائق، مجاني بالكامل):

   1. اذهبي إلى https://console.firebase.google.com
   2. "Add project" → أعطيه اسماً (مثال: iap-flowtalk-club) → أنشئيه
   3. من القائمة الجانبية: Build → Authentication → Get started
      → فعّلي "Email/Password" كطريقة دخول (Sign-in method)
   4. من نفس صفحة Authentication → تبويب "Users" → "Add user"
      أضيفي 3 حسابات (مدربة الإنجليزية + الشخصين الآخرين)
      بنفس الإيميلات المكتوبة في js/config.js، وكلمة مرور قوية لكل واحد
   5. من ⚙️ Project settings (أعلى القائمة الجانبية) → انزلي لـ "Your apps"
      → اضغطي على أيقونة الويب </> → سجّلي التطبيق
      → انسخي الأرقام والنصوص اللي تظهر في "firebaseConfig" والصقيها تحت
   6. احفظي الملف — الحماية الحقيقية تفعّل نفسها تلقائياً

   ما دام لم تُملأ هذه القيم، يستمر الموقع تلقائياً بالحماية المحلية
   (كلمة مرور مشفّرة محلياً) التي بنيناها سابقاً — لا شيء ينكسر.
   ========================================================= */
var FLOW_FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  appId: "YOUR_APP_ID"
};

var FLOW_FIREBASE_ENABLED = (FLOW_FIREBASE_CONFIG.apiKey && FLOW_FIREBASE_CONFIG.apiKey.indexOf('YOUR_') !== 0);
