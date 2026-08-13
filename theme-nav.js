/* =========================================================
   مشترك بين كل الصفحات: الوضع الداكن/الفاتح + قائمة الهاتف
   ========================================================= */
var safeStore = {
  get: function(k){ try { return localStorage.getItem(k); } catch(e){ return null; } },
  set: function(k,v){ try { localStorage.setItem(k,v); } catch(e){} }
};

(function initTheme(){
  var root = document.documentElement;
  var btn = document.getElementById('themeToggle');
  if (!btn) return;
  var saved = safeStore.get('ft-theme');
  var initial = saved || 'light';
  root.setAttribute('data-theme', initial);
  btn.textContent = initial === 'dark' ? '☀️' : '🌙';
  btn.addEventListener('click', function(){
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    btn.textContent = next === 'dark' ? '☀️' : '🌙';
    safeStore.set('ft-theme', next);
  });
})();

(function initMobileNav(){
  var burger = document.getElementById('burgerBtn');
  var nav = document.querySelector('.nav-links');
  if (!burger || !nav) return;
  burger.addEventListener('click', function(){ nav.classList.toggle('mobile-open'); });
  var links = nav.querySelectorAll('a');
  for (var i = 0; i < links.length; i++) {
    links[i].addEventListener('click', function(){ nav.classList.remove('mobile-open'); });
  }
})();
