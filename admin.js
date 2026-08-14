/* =========================================================
   لوحة تحكم المشرفين — Sujet de la semaine, Leçons, Activités, Événements
   ========================================================= */
(function(){
  var content = document.getElementById('adminContent');

  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }

  function guardScreen(message, showLogin){
    content.innerHTML =
      '<div class="admin-guard">' +
        '<div>' +
          '<h2 style="font-family:\'Poppins\',sans-serif; font-size:22px; margin-bottom:10px;">' + message + '</h2>' +
          (showLogin ? '<a href="login.html?return=admin.html" class="btn btn-primary">Se connecter</a>' : '<a href="index.html" class="btn btn-ghost">Retour au site</a>') +
        '</div>' +
      '</div>';
  }

  /* ---------- بوابة كلمة المرور الإدارية (طبقة حماية إضافية) ---------- */
  function passwordGate(email, hasPwd){
    var isFirebase = FlowAdminAuth.mode() === 'firebase';
    var modeTag = isFirebase
      ? '<div style="font-size:11px; font-weight:700; color:#2AAF7C; margin-bottom:10px;">☁️ Protection Firebase active (authentification serveur)</div>'
      : '<div style="font-size:11px; font-weight:700; color:var(--dim); margin-bottom:10px;">🔒 Protection locale (configurez Firebase pour plus de sécurité — voir js/firebase-config.js)</div>';

    // في وضع Firebase، الحساب مُنشأ مسبقاً عبر Firebase Console: لا حاجة لتهيئة أولى
    var needsSetup = !isFirebase && !hasPwd;

    content.innerHTML =
      '<div class="admin-guard">' +
        '<div class="admin-lock-box">' +
          modeTag +
          '<div class="ic">🔒</div>' +
          '<h2>' + (needsSetup ? 'Créer votre mot de passe administrateur' : 'Accès protégé') + '</h2>' +
          '<p class="sub">' + (needsSetup ? 'Première utilisation : choisissez un mot de passe pour protéger cet espace sur cet appareil.' : 'Entrez votre mot de passe administrateur pour continuer.') + '</p>' +
          '<div class="field" style="text-align:start;"><label>Mot de passe' + (needsSetup ? ' (min. 6 caractères)' : '') + '</label><input id="pwInput" type="password" autofocus></div>' +
          (needsSetup ? '<div class="field" style="text-align:start;"><label>Confirmer le mot de passe</label><input id="pwConfirm" type="password"></div>' : '') +
          '<div class="form-error" id="pwError" style="display:none;"></div>' +
          '<button class="btn btn-primary btn-block" id="pwSubmit" style="margin-top:6px;">' + (needsSetup ? 'Créer le mot de passe' : 'Déverrouiller') + '</button>' +
        '</div>' +
      '</div>';

    var pwInput = document.getElementById('pwInput');
    var pwError = document.getElementById('pwError');
    var pwSubmit = document.getElementById('pwSubmit');

    function showError(msg){ pwError.textContent = msg; pwError.style.display = 'block'; }

    pwSubmit.addEventListener('click', function(){
      var pw = pwInput.value;
      pwError.style.display = 'none';

      if (needsSetup) {
        var confirmPw = document.getElementById('pwConfirm').value;
        if (pw.length < 6) { showError('Le mot de passe doit contenir au moins 6 caractères.'); return; }
        if (pw !== confirmPw) { showError('Les mots de passe ne correspondent pas.'); return; }
        pwSubmit.disabled = true; pwSubmit.textContent = 'Création…';
        FlowAdminAuth.setPassword(email, pw).then(function(){
          return FlowAdminAuth.signIn(email, pw);
        }).then(function(){
          bootDashboard();
        })['catch'](function(){
          showError('Une erreur est survenue. Réessayez.');
          pwSubmit.disabled = false; pwSubmit.textContent = 'Créer le mot de passe';
        });
        return;
      }

      pwSubmit.disabled = true; pwSubmit.textContent = 'Vérification…';
      FlowAdminAuth.signIn(email, pw).then(function(){
        bootDashboard();
      })['catch'](function(err){
        pwSubmit.disabled = false; pwSubmit.textContent = 'Déverrouiller';
        if (err && err.notAuthorized) {
          showError('⛔ Ce compte Firebase n\u2019est pas autorisé comme administrateur.');
        } else if (err && err.locked) {
          showError('🔒 Trop de tentatives. Réessayez dans ' + err.minutes + ' min.');
        } else if (err && err.wrongPassword) {
          showError(isFirebase ? 'Email ou mot de passe incorrect.' : 'Mot de passe incorrect. ' + err.attemptsLeft + ' tentative(s) restante(s).');
        } else {
          showError('Une erreur est survenue.');
        }
      });
    });

    pwInput.addEventListener('keypress', function(e){ if (e.key === 'Enter') pwSubmit.click(); });
  }

  function layout(){
    content.innerHTML =
      '<div class="container admin-head" style="display:flex; align-items:flex-end; justify-content:space-between; gap:16px; flex-wrap:wrap;">' +
        '<div>' +
          '<div class="eyebrow">Espace réservé</div>' +
          '<h1 style="font-family:\'Poppins\',sans-serif; font-weight:800; font-size:28px;">⚙️ Administration du club</h1>' +
          '<p style="color:var(--dim); font-size:14px; margin-top:4px;">Gérez le sujet de la semaine, les leçons, les activités et les événements.</p>' +
        '</div>' +
        '<button class="btn btn-ghost" id="lockBtn">🔒 Verrouiller l\u2019accès</button>' +
      '</div>' +
      '<div class="container" style="padding-bottom:100px;">' +
        '<div class="admin-stats" id="adminStats"></div>' +
        '<div class="admin-tabs">' +
          '<button class="admin-tab active" data-tab="topic">💬 Sujet de la semaine</button>' +
          '<button class="admin-tab" data-tab="lessons">📚 Leçons</button>' +
          '<button class="admin-tab" data-tab="activities">✨ Activités</button>' +
          '<button class="admin-tab" data-tab="events">📅 Événements</button>' +
        '</div>' +
        '<div class="admin-panel active" id="panel-topic"></div>' +
        '<div class="admin-panel" id="panel-lessons"></div>' +
        '<div class="admin-panel" id="panel-activities"></div>' +
        '<div class="admin-panel" id="panel-events"></div>' +
      '</div>';

    document.getElementById('lockBtn').addEventListener('click', function(){
      FlowAdminAuth.endSession();
      window.location.reload();
    });

    var tabs = content.querySelectorAll('.admin-tab');
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].addEventListener('click', function(){
        for (var j = 0; j < tabs.length; j++) tabs[j].classList.remove('active');
        this.classList.add('active');
        var panels = content.querySelectorAll('.admin-panel');
        for (var k = 0; k < panels.length; k++) panels[k].classList.remove('active');
        document.getElementById('panel-' + this.getAttribute('data-tab')).classList.add('active');
      });
    }
  }

  function loadStats(){
    Promise.all([
      FlowDB.getAll('members'), FlowDB.getAll('trainerEnrollments'),
      FlowDB.getAll('lessons'), FlowDB.getAll('activities'),
    ]).then(function(r){
      var box = document.getElementById('adminStats');
      var labels = [
        [r[0].length, 'Membres inscrits'],
        [r[1].length, 'Formateurs au programme'],
        [r[2].length, 'Leçons publiées'],
        [r[3].length, 'Activités du club'],
      ];
      box.innerHTML = labels.map(function(l){
        return '<div class="stat-box"><b>' + l[0] + '</b><span>' + l[1] + '</span></div>';
      }).join('');
    });
  }

  /* ---------- Panel : Sujet de la semaine ---------- */
  function loadTopicPanel(){
    var panel = document.getElementById('panel-topic');
    FlowDB.getWeeklyTopic().then(function(topic){
      panel.innerHTML =
        '<div class="panel">' +
          '<div class="panel-head"><h3>💬 Modifier le sujet / mot de la semaine</h3></div>' +
          '<div class="field"><label>Titre</label><input id="topicTitle" type="text" value="' + esc(topic.title) + '"></div>' +
          '<div class="field"><label>Description</label><textarea id="topicDesc">' + esc(topic.desc) + '</textarea></div>' +
          '<button class="btn btn-primary" id="topicSave">Enregistrer</button>' +
          '<span id="topicSaved" style="display:none; color:var(--orange); font-size:12.5px; font-weight:700; margin-inline-start:10px;">✓ Enregistré</span>' +
        '</div>';
      document.getElementById('topicSave').addEventListener('click', function(){
        var value = { title: document.getElementById('topicTitle').value.trim(), desc: document.getElementById('topicDesc').value.trim() };
        FlowDB.setWeeklyTopic(value).then(function(){
          var s = document.getElementById('topicSaved');
          s.style.display = 'inline'; setTimeout(function(){ s.style.display = 'none'; }, 2000);
        });
      });
    });
  }

  /* ---------- Panel : Leçons ---------- */
  function loadLessonsPanel(){
    var panel = document.getElementById('panel-lessons');
    FlowDB.getAll('lessons').then(function(lessons){
      var rows = lessons.map(function(l){
        return '<div class="admin-list-row"><div class="meta"><h4>' + esc(l.title) + '</h4><small>' + esc(l.category) + (l.link ? ' · ' + esc(l.link) : '') + '</small></div><button class="del-btn" data-id="' + l.id + '">Supprimer</button></div>';
      }).join('') || '<p style="color:var(--dim); font-size:13px;">Aucune leçon publiée.</p>';

      panel.innerHTML =
        '<div class="admin-grid2">' +
          '<div class="panel"><div class="panel-head"><h3>📚 Leçons publiées</h3></div>' + rows + '</div>' +
          '<div class="panel">' +
            '<div class="panel-head"><h3>➕ Ajouter une leçon</h3></div>' +
            '<div class="field"><label>Titre</label><input id="lTitle" type="text" placeholder="Ex. Past Simple vs Present Perfect"></div>' +
            '<div class="field"><label>Catégorie</label><input id="lCategory" type="text" placeholder="Ex. Grammar, HSE Vocabulary…"></div>' +
            '<div class="field"><label>Description</label><textarea id="lDesc" placeholder="Résumé de la leçon"></textarea></div>' +
            '<div class="field"><label>Lien (optionnel)</label><input id="lLink" type="text" placeholder="Lien vers le support"></div>' +
            '<button class="btn btn-primary btn-block" id="lAdd">Publier la leçon</button>' +
          '</div>' +
        '</div>';

      var delBtns = panel.querySelectorAll('.del-btn');
      for (var i = 0; i < delBtns.length; i++) {
        delBtns[i].addEventListener('click', function(){
          var id = parseInt(this.getAttribute('data-id'), 10);
          FlowDB.del('lessons', id).then(function(){ loadLessonsPanel(); loadStats(); });
        });
      }
      document.getElementById('lAdd').addEventListener('click', function(){
        var title = document.getElementById('lTitle').value.trim();
        if (!title) return;
        var lesson = {
          title: title,
          category: document.getElementById('lCategory').value.trim(),
          desc: document.getElementById('lDesc').value.trim(),
          link: document.getElementById('lLink').value.trim(),
          createdAt: new Date().toISOString(),
        };
        FlowDB.put('lessons', lesson).then(function(){ loadLessonsPanel(); loadStats(); });
      });
    });
  }

  /* ---------- Panel : Activités ---------- */
  function loadActivitiesPanel(){
    var panel = document.getElementById('panel-activities');
    FlowDB.getAll('activities').then(function(activities){
      var rows = activities.map(function(a){
        return '<div class="admin-list-row"><div class="meta"><h4>' + a.icon + ' ' + esc(a.title) + '</h4><small>' + esc(a.schedule) + ' · +' + a.points + ' pts</small></div><button class="del-btn" data-id="' + esc(a.id) + '">Supprimer</button></div>';
      }).join('') || '<p style="color:var(--dim); font-size:13px;">Aucune activité.</p>';

      panel.innerHTML =
        '<div class="admin-grid2">' +
          '<div class="panel"><div class="panel-head"><h3>✨ Activités actuelles</h3></div>' + rows + '</div>' +
          '<div class="panel">' +
            '<div class="panel-head"><h3>➕ Ajouter une activité</h3></div>' +
            '<div class="field"><label>Emoji / icône</label><input id="aIcon" type="text" placeholder="🎯" maxlength="4"></div>' +
            '<div class="field"><label>Titre</label><input id="aTitle" type="text" placeholder="Ex. Public Speaking Club"></div>' +
            '<div class="field"><label>Description courte</label><input id="aShort" type="text" placeholder="Une phrase courte"></div>' +
            '<div class="field"><label>Description détaillée</label><textarea id="aDetail" placeholder="Détail affiché sur la page de l\u2019activité"></textarea></div>' +
            '<div class="field"><label>Planning</label><input id="aSchedule" type="text" placeholder="Ex. Chaque lundi · 15:00"></div>' +
            '<div class="field"><label>Points de participation</label><input id="aPoints" type="number" value="10"></div>' +
            '<button class="btn btn-primary btn-block" id="aAdd">Ajouter l\u2019activité</button>' +
          '</div>' +
        '</div>';

      var delBtns = panel.querySelectorAll('.del-btn');
      for (var i = 0; i < delBtns.length; i++) {
        delBtns[i].addEventListener('click', function(){
          var id = this.getAttribute('data-id');
          FlowDB.del('activities', id).then(function(){ loadActivitiesPanel(); loadStats(); });
        });
      }
      document.getElementById('aAdd').addEventListener('click', function(){
        var title = document.getElementById('aTitle').value.trim();
        if (!title) return;
        var slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
        var activity = {
          id: slug,
          icon: document.getElementById('aIcon').value.trim() || '✨',
          title: title,
          short: document.getElementById('aShort').value.trim(),
          detail: document.getElementById('aDetail').value.trim(),
          schedule: document.getElementById('aSchedule').value.trim(),
          points: parseInt(document.getElementById('aPoints').value, 10) || 10,
        };
        FlowDB.put('activities', activity).then(function(){ loadActivitiesPanel(); loadStats(); });
      });
    });
  }

  /* ---------- Panel : Événements ---------- */
  function loadEventsPanel(){
    var panel = document.getElementById('panel-events');
    FlowDB.getAll('events').then(function(events){
      var rows = events.map(function(e){
        return '<div class="admin-list-row"><div class="meta"><h4>' + esc(e.day) + ' ' + esc(e.month) + ' — ' + esc(e.title) + '</h4><small>' + esc(e.desc) + ' · ' + esc(e.time) + '</small></div><button class="del-btn" data-id="' + esc(e.id) + '">Supprimer</button></div>';
      }).join('') || '<p style="color:var(--dim); font-size:13px;">Aucun événement.</p>';

      panel.innerHTML =
        '<div class="admin-grid2">' +
          '<div class="panel"><div class="panel-head"><h3>📅 Événements actuels</h3></div>' + rows + '</div>' +
          '<div class="panel">' +
            '<div class="panel-head"><h3>➕ Ajouter un événement</h3></div>' +
            '<div class="field"><label>Jour</label><input id="eDay" type="text" placeholder="18"></div>' +
            '<div class="field"><label>Mois</label><input id="eMonth" type="text" placeholder="Juil."></div>' +
            '<div class="field"><label>Titre</label><input id="eTitle" type="text" placeholder="Ex. Cultural Exchange Day"></div>' +
            '<div class="field"><label>Description</label><input id="eDesc" type="text" placeholder="Courte description"></div>' +
            '<div class="field"><label>Horaire</label><input id="eTime" type="text" placeholder="15:00 – 17:00"></div>' +
            '<button class="btn btn-primary btn-block" id="eAdd">Ajouter l\u2019événement</button>' +
          '</div>' +
        '</div>';

      var delBtns = panel.querySelectorAll('.del-btn');
      for (var i = 0; i < delBtns.length; i++) {
        delBtns[i].addEventListener('click', function(){
          var id = this.getAttribute('data-id');
          FlowDB.del('events', id).then(function(){ loadEventsPanel(); loadStats(); });
        });
      }
      document.getElementById('eAdd').addEventListener('click', function(){
        var title = document.getElementById('eTitle').value.trim();
        var day = document.getElementById('eDay').value.trim();
        if (!title || !day) return;
        var event = {
          id: 'ev-' + Date.now(),
          day: day,
          month: document.getElementById('eMonth').value.trim(),
          title: title,
          desc: document.getElementById('eDesc').value.trim(),
          time: document.getElementById('eTime').value.trim(),
        };
        FlowDB.put('events', event).then(function(){ loadEventsPanel(); loadStats(); });
      });
    });
  }

  function bootDashboard(){
    layout();
    loadStats();
    loadTopicPanel();
    loadLessonsPanel();
    loadActivitiesPanel();
    loadEventsPanel();
  }

  FlowDB.seedIfEmpty().then(function(){
    return FlowAuth.currentMember();
  }).then(function(member){
    if (!member) { guardScreen('Connectez-vous pour accéder à l\u2019administration.', true); return; }
    if (!FlowAuth.isAdmin(member)) { guardScreen('⛔ Accès réservé aux administrateurs du club.', false); return; }

    if (FlowAdminAuth.isSessionActive(member.email)) { bootDashboard(); return; }

    if (FlowAdminAuth.mode() === 'local' && FlowAdminAuth.isLocked(member.email)) {
      guardScreen('🔒 Trop de tentatives. Réessayez dans ' + FlowAdminAuth.lockRemainingMinutes(member.email) + ' min.', false);
      return;
    }

    FlowAdminAuth.hasPassword(member.email).then(function(hasPwd){
      passwordGate(member.email, hasPwd);
    });
  })['catch'](function(){
    guardScreen('Une erreur est survenue. Réessayez depuis un navigateur récent.', false);
  });
})();
