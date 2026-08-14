/* =========================================================
   IAP FlowTalk English Club — التفاعلات (الصفحة الرئيسية)
   ملاحظة: الوضع الداكن + قائمة الهاتف موجودان في theme-nav.js المشترك
   ========================================================= */

/* ---------- 3) شبكة الأنشطة (من قاعدة البيانات المحلية) ---------- */
(function initActivities(){
  var grid = document.getElementById('activitiesGrid');
  if (!grid) return;
  FlowDB.seedIfEmpty().then(function(){
    return FlowDB.getAll('activities');
  }).then(function(activities){
    var html = '';
    for (var i = 0; i < activities.length; i++) {
      var a = activities[i];
      html += '' +
        '<a class="activity-card" href="activity.html?id=' + encodeURIComponent(a.id) + '">' +
          '<div class="ic">' + a.icon + '</div>' +
          '<h4>' + a.title + '</h4>' +
          '<p class="always">' + a.short + '</p>' +
          '<div class="hint">Voir les détails →</div>' +
        '</a>';
    }
    grid.innerHTML = html;
  })['catch'](function(err){
    grid.innerHTML = '<p style="color:var(--dim); font-size:13px;">Impossible de charger les activités.</p>';
  });
})();

/* ---------- 3bis) قائمة الأحداث (من قاعدة البيانات المحلية) ---------- */
(function initEvents(){
  var list = document.getElementById('eventsList');
  if (!list) return;
  FlowDB.seedIfEmpty().then(function(){
    return FlowDB.getAll('events');
  }).then(function(events){
    var html = '';
    for (var i = 0; i < events.length; i++) {
      var e = events[i];
      html += '' +
        '<div class="event-row">' +
          '<div class="event-date"><b>' + e.day + '</b><span>' + e.month + '</span></div>' +
          '<div class="event-info">' +
            '<h4>' + e.title + '</h4>' +
            '<p>' + e.desc + '</p>' +
            '<span class="time">' + e.time + '</span>' +
          '</div>' +
        '</div>';
    }
    list.innerHTML = html;
  })['catch'](function(){});
})();

/* ---------- 4) استطلاع الأسبوع (يعمل فعلياً عبر التخزين المحلي) ---------- */
(function initPoll(){
  var KEY = 'ft-poll-votes';
  var VOTED_KEY = 'ft-poll-voted';
  var options = document.querySelectorAll('.poll-option');
  var voteBtn = document.getElementById('voteBtn');

  function getVotes(){
    try { return JSON.parse(safeStore.get(KEY)) || {}; }
    catch(e){ return {}; }
  }
  function renderResults(){
    var votes = getVotes();
    var total = 0;
    for (var k in votes) { if (votes.hasOwnProperty(k)) total += votes[k]; }
    if (total === 0) total = 1;
    for (var i = 0; i < options.length; i++) {
      var opt = options[i];
      var name = opt.getAttribute('data-opt');
      var count = votes[name] || 0;
      var pct = Math.round((count / total) * 100);
      opt.classList.add('voted');
      opt.querySelector('.fill').style.width = pct + '%';
      opt.querySelector('.pct').textContent = pct + '%';
    }
  }

  if (safeStore.get(VOTED_KEY)) {
    renderResults();
    voteBtn.textContent = 'Merci pour votre vote !';
    voteBtn.disabled = true;
  }

  voteBtn.addEventListener('click', function(){
    if (safeStore.get(VOTED_KEY)) return;
    var checked = document.querySelector('input[name="poll"]:checked');
    if (!checked) {
      voteBtn.textContent = 'Choisissez une option d\u2019abord';
      setTimeout(function(){ voteBtn.textContent = 'Voter'; }, 1600);
      return;
    }
    var votes = getVotes();
    votes[checked.value] = (votes[checked.value] || 0) + 1;
    safeStore.set(KEY, JSON.stringify(votes));
    safeStore.set(VOTED_KEY, checked.value);
    renderResults();
    voteBtn.textContent = 'Merci pour votre vote !';
    voteBtn.disabled = true;

    // نقاط مكافأة للأعضاء المسجلين
    var memberId = FlowAuth.currentId();
    if (memberId) {
      FlowAuth.addPoints(memberId, 5).then(function(){
        if (window.FlowHeaderAuth) window.FlowHeaderAuth.refresh();
      });
    }
  });
})();

/* ---------- 5) تثبيت التطبيق (PWA) ---------- */
(function initInstall(){
  var deferredPrompt = null;
  var installBtn = document.getElementById('installBtn');
  window.addEventListener('beforeinstallprompt', function(e){
    e.preventDefault();
    deferredPrompt = e;
    installBtn.style.display = 'flex';
  });
  installBtn.addEventListener('click', function(){
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function(){
      deferredPrompt = null;
      installBtn.style.display = 'none';
    });
  });
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function(){
      navigator.serviceWorker.register('service-worker.js').catch(function(){});
    });
  }
})();

/* ---------- 6) تخصيص بانر برنامج المدربين حسب دور العضو المسجّل ---------- */
(function personalizeTrainerPromo(){
  var titleEl = document.getElementById('trainerPromoTitle');
  var descEl = document.getElementById('trainerPromoDesc');
  var btnEl = document.getElementById('trainerPromoBtn');
  if (!titleEl) return;
  FlowDB.seedIfEmpty().then(function(){ return FlowAuth.currentMember(); }).then(function(member){
    if (!member || member.role !== 'trainer') return;
    titleEl.textContent = 'Bienvenue, Formateur 🎓';
    descEl.textContent = 'Continuez votre programme "English for Trainers" et suivez votre progression module par module.';
    btnEl.textContent = 'Continuer mon programme →';
  })['catch'](function(){});
})();

/* ---------- 7) موضوع الأسبوع (يُدار من لوحة الإدارة) ---------- */
(function initWeeklyTopic(){
  var panel = document.getElementById('weeklyTopicPanel');
  if (!panel) return;
  FlowDB.seedIfEmpty().then(function(){ return FlowDB.getWeeklyTopic(); }).then(function(topic){
    panel.innerHTML =
      '<div class="panel-head"><h3>💬 Sujet de la Semaine</h3></div>' +
      '<p style="font-weight:700; font-family:\'Poppins\',sans-serif; font-size:15px; color:var(--orange);">' + topic.title + '</p>' +
      '<p style="color:var(--dim); font-size:13px; margin-top:4px;">' + topic.desc + '</p>';
  })['catch'](function(){
    panel.innerHTML = '<div class="panel-head"><h3>💬 Sujet de la Semaine</h3></div><p style="color:var(--dim); font-size:13px;">Indisponible pour le moment.</p>';
  });
})();

/* ---------- 8) آخر الدروس المنشورة (تُدار من لوحة الإدارة) ---------- */
(function initLessons(){
  var wrap = document.getElementById('lessonsList');
  if (!wrap) return;
  FlowDB.seedIfEmpty().then(function(){ return FlowDB.getAll('lessons'); }).then(function(lessons){
    if (!lessons.length) {
      wrap.innerHTML = '<p style="color:var(--dim); font-size:13px;">Aucune leçon publiée pour le moment.</p>';
      return;
    }
    lessons.sort(function(a,b){ return new Date(b.createdAt) - new Date(a.createdAt); });
    var top = lessons.slice(0, 4);
    var html = '';
    for (var i = 0; i < top.length; i++) {
      var l = top[i];
      html += '' +
        '<div class="history-row">' +
          '<div class="ic">📘</div>' +
          '<div><h4>' + l.title + '</h4><small>' + (l.category || 'Leçon') + '</small></div>' +
        '</div>';
    }
    wrap.innerHTML = html;
  })['catch'](function(){
    wrap.innerHTML = '<p style="color:var(--dim); font-size:13px;">Indisponible pour le moment.</p>';
  });
})();
