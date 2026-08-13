/* =========================================================
   FlowAdminAuth — حماية إضافية للوحة التحكم:
   - كلمة مرور مخصّصة (لا تُخزَّن أبداً كنص صريح، فقط كـ hash عبر SHA-256)
   - جلسة إدارية منفصلة تنتهي بإغلاق التبويب (sessionStorage)
   - قفل تلقائي بعد 5 محاولات فاشلة (15 دقيقة)
   ملاحظة أمانة: الموقع بالكامل client-side بدون خادم، لذا هذا يحمي من
   الدخول العرضي/الفضولي لأي شخص آخر يملك نفس الحاسوب أو يجد الرابط،
   وليس حماية مستوى خادم حقيقي (تلك تتطلب Backend فعلي).
   ========================================================= */
var FlowAdminAuth = (function(){
  var SESSION_KEY = 'ft-admin-session';
  var MAX_ATTEMPTS = 5;
  var LOCK_MINUTES = 15;

  function safeGet(k){ try { return localStorage.getItem(k); } catch(e){ return null; } }
  function safeSet(k,v){ try { localStorage.setItem(k,v); } catch(e){} }
  function sessGet(k){ try { return sessionStorage.getItem(k); } catch(e){ return null; } }
  function sessSet(k,v){ try { sessionStorage.setItem(k,v); } catch(e){} }
  function sessRemove(k){ try { sessionStorage.removeItem(k); } catch(e){} }

  function sha256(text){
    if (!window.crypto || !window.crypto.subtle) {
      return Promise.reject(new Error('Web Crypto non disponible sur ce navigateur.'));
    }
    var data = new TextEncoder().encode(text);
    return crypto.subtle.digest('SHA-256', data).then(function(buf){
      var bytes = Array.from(new Uint8Array(buf));
      return bytes.map(function(b){ return b.toString(16).padStart(2, '0'); }).join('');
    });
  }

  function lockKey(email){ return 'ft-admin-lock-' + email; }

  function getLockState(email){
    try { return JSON.parse(safeGet(lockKey(email))) || { count: 0, lockedUntil: 0 }; }
    catch(e){ return { count: 0, lockedUntil: 0 }; }
  }
  function setLockState(email, state){ safeSet(lockKey(email), JSON.stringify(state)); }

  function isLocked(email){
    var s = getLockState(email);
    return s.lockedUntil && Date.now() < s.lockedUntil;
  }
  function lockRemainingMinutes(email){
    var s = getLockState(email);
    return Math.max(1, Math.ceil((s.lockedUntil - Date.now()) / 60000));
  }
  function registerFailedAttempt(email){
    var s = getLockState(email);
    s.count = (s.count || 0) + 1;
    if (s.count >= MAX_ATTEMPTS) {
      s.lockedUntil = Date.now() + LOCK_MINUTES * 60000;
      s.count = 0;
    }
    setLockState(email, s);
    return s;
  }
  function clearLock(email){ setLockState(email, { count: 0, lockedUntil: 0 }); }

  function hasPassword(email){
    return FlowDB.get('adminAuth', email).then(function(row){ return !!row; });
  }

  function setPassword(email, password){
    return sha256(password).then(function(hash){
      return FlowDB.put('adminAuth', { email: email, hash: hash, updatedAt: new Date().toISOString() });
    });
  }

  function verifyPassword(email, password){
    if (isLocked(email)) {
      return Promise.reject({ locked: true, minutes: lockRemainingMinutes(email) });
    }
    return FlowDB.get('adminAuth', email).then(function(row){
      if (!row) return Promise.reject(new Error('no_password_set'));
      return sha256(password).then(function(hash){
        if (hash === row.hash) {
          clearLock(email);
          sessSet(SESSION_KEY, email);
          return true;
        }
        var state = registerFailedAttempt(email);
        if (state.lockedUntil && Date.now() < state.lockedUntil) {
          return Promise.reject({ locked: true, minutes: lockRemainingMinutes(email) });
        }
        return Promise.reject({ wrongPassword: true, attemptsLeft: Math.max(0, MAX_ATTEMPTS - (state.count || 0)) });
      });
    });
  }

  function isSessionActive(email){
    return sessGet(SESSION_KEY) === email;
  }

  function endSession(){
    sessRemove(SESSION_KEY);
  }

  /* =======================================================
     طبقة Firebase Authentication (مصادقة حقيقية عبر خوادم Google)
     تُستخدم تلقائياً إذا كانت js/firebase-config.js مُعدّة،
     وإلا يبقى النظام يعمل بالحماية المحلية أعلاه (fallback).
     ======================================================= */
  var firebaseReady = false;

  function firebaseAvailable(){
    return !!(window.FLOW_FIREBASE_ENABLED && typeof firebase !== 'undefined');
  }

  function ensureFirebaseInit(){
    if (!firebaseAvailable()) return false;
    if (!firebaseReady) {
      try {
        if (!firebase.apps || !firebase.apps.length) firebase.initializeApp(FLOW_FIREBASE_CONFIG);
        firebaseReady = true;
      } catch (e) { firebaseReady = false; }
    }
    return firebaseReady;
  }

  function mode(){
    return ensureFirebaseInit() ? 'firebase' : 'local';
  }

  /* دخول عبر Firebase: يتحقق من الإيميل+كلمة المرور عند خوادم Google،
     ثم يتأكد إضافياً أن الإيميل ضمن قائمة المشرفين المصرّح لهم (دفاع مضاعف). */
  function firebaseSignIn(email, password){
    return firebase.auth().signInWithEmailAndPassword(email, password).then(function(cred){
      var list = (window.FLOW_ADMIN_EMAILS || []).map(function(e){ return e.toLowerCase(); });
      if (list.indexOf(cred.user.email.toLowerCase()) === -1) {
        return firebase.auth().signOut().then(function(){
          return Promise.reject({ notAuthorized: true });
        });
      }
      return true;
    })['catch'](function(err){
      if (err && err.notAuthorized) return Promise.reject(err);
      var code = err && err.code;
      if (code === 'auth/too-many-requests') return Promise.reject({ locked: true, minutes: 'quelques' });
      return Promise.reject({ wrongPassword: true, firebaseCode: code });
    });
  }

  function firebaseIsSessionActive(email){
    if (!ensureFirebaseInit()) return false;
    var user = firebase.auth().currentUser;
    return !!(user && user.email && user.email.toLowerCase() === email.toLowerCase());
  }

  function firebaseEndSession(){
    if (ensureFirebaseInit()) firebase.auth().signOut();
  }

  /* ---------- واجهة موحّدة يستخدمها admin.js ---------- */
  function unifiedIsSessionActive(email){
    return mode() === 'firebase' ? firebaseIsSessionActive(email) : isSessionActive(email);
  }
  function unifiedEndSession(){
    if (mode() === 'firebase') firebaseEndSession(); else endSession();
  }
  function unifiedSignIn(email, password){
    return mode() === 'firebase' ? firebaseSignIn(email, password) : verifyPassword(email, password);
  }

  return {
    hasPassword: hasPassword, setPassword: setPassword, verifyPassword: verifyPassword,
    isSessionActive: unifiedIsSessionActive, endSession: unifiedEndSession, isLocked: isLocked,
    lockRemainingMinutes: lockRemainingMinutes, mode: mode, signIn: unifiedSignIn,
  };
})();
