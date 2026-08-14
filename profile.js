/* =========================================================
   منطق صفحة الملف الشخصي: نقاط، مستوى، شارات، سجل مشاركة
   ========================================================= */
(function(){
  var content = document.getElementById('profileContent');

  var BADGE_ICONS = { 'Beginner': '🌱', 'Explorer': '🧭', 'Communicator': '💬', 'Ambassador': '🌟', 'Language Champion': '🏆' };

  function levelIndex(levelName){
    for (var i = 0; i < FlowDB.LEVELS.length; i++) { if (FlowDB.LEVELS[i].name === levelName) return i; }
    return 0;
  }

  function render(member, activitiesById, participations){
    var lvl = FlowDB.levelFor(member.points || 0);
    var curIdx = levelIndex(lvl.current.name);
    var nextMin = lvl.next ? lvl.next.min : lvl.current.min;
    var prevMin = lvl.current.min;
    var span = nextMin - prevMin || 1;
    var progressPct = lvl.next ? Math.min(100, Math.round(((member.points - prevMin) / span) * 100)) : 100;

    var badgesHtml = '';
    for (var i = 0; i < FlowDB.LEVELS.length; i++) {
      var L = FlowDB.LEVELS[i];
      var earned = i <= curIdx;
      badgesHtml += '' +
        '<div class="badge-tile' + (earned ? ' earned' : '') + '">' +
          '<div class="ic">' + BADGE_ICONS[L.name] + '</div>' +
          '<span>' + L.name + '</span>' +
        '</div>';
    }

    var historyHtml = '';
    if (!participations.length) {
      historyHtml = '<p style="color:var(--dim); font-size:13.5px;">Aucune activité rejointe pour le moment. <a href="index.html#activities" style="color:var(--orange); font-weight:700;">Découvrir les activités →</a></p>';
    } else {
      participations.sort(function(a,b){ return new Date(b.joinedAt) - new Date(a.joinedAt); });
      for (var j = 0; j < participations.length; j++) {
        var p = participations[j];
        var act = activitiesById[p.activityId];
        var date = new Date(p.joinedAt);
        historyHtml += '' +
          '<div class="history-row">' +
            '<div class="ic">' + (act ? act.icon : '✨') + '</div>' +
            '<div><h4>' + (act ? act.title : p.activityId) + '</h4><small>' + date.toLocaleDateString('fr-FR') + '</small></div>' +
            '<div class="pts">+' + p.points + '</div>' +
          '</div>';
      }
    }

    content.innerHTML =
      '<div class="container profile-head">' +
        '<div class="profile-avatar">' + member.name.charAt(0).toUpperCase() + '</div>' +
        '<div>' +
          '<h1 style="font-family:\'Poppins\',sans-serif; font-weight:800; font-size:24px;">' + member.name + '</h1>' +
          '<p style="color:var(--dim); font-size:13.5px;">' + member.email + '</p>' +
          '<span class="eyebrow" style="margin:6px 0 0;">' + (member.role === 'trainer' ? '🎓 Formateur / Personnel IAP' : '🧑\u200d🎓 Stagiaire') + '</span>' +
          (member.structure ? '<p style="font-size:12.5px; color:var(--dim); margin-top:4px;">📍 ' + member.structure + '</p>' : '') +
        '</div>' +
        '<button class="btn btn-ghost" id="logoutBtn" style="margin-inline-start:auto;">Se déconnecter</button>' +
      '</div>' +
      (member.role === 'trainer' ? '<div class="container" style="padding-bottom:10px;"><a href="trainers.html" class="btn btn-primary">Accéder à mon programme de formation →</a></div>' : '') +
      '<div class="container dash-grid" style="grid-template-columns:1fr 1fr; padding-top:0; padding-bottom:90px;">' +
        '<div class="col">' +
          '<div class="panel">' +
            '<div class="panel-head"><h3>🏅 Progression</h3></div>' +
            '<p style="font-size:14px;"><b>' + (member.points || 0) + ' pts</b> · ' + lvl.current.name + '</p>' +
            '<div class="progress-track"><div class="progress-fill" style="width:' + progressPct + '%;"></div></div>' +
            '<p style="font-size:11.5px; color:var(--dim);">' + (lvl.next ? (nextMin - member.points) + ' pts avant ' + lvl.next.name : 'Niveau maximum atteint !') + '</p>' +
            '<div class="badge-grid">' + badgesHtml + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="col">' +
          '<div class="panel">' +
            '<div class="panel-head"><h3>📜 Historique de participation</h3></div>' +
            historyHtml +
          '</div>' +
        '</div>' +
      '</div>';

    document.getElementById('logoutBtn').addEventListener('click', function(){
      FlowAuth.logout();
      window.location.href = 'index.html';
    });
  }

  FlowDB.seedIfEmpty().then(function(){
    return FlowAuth.currentMember();
  }).then(function(member){
    if (!member) {
      window.location.href = 'login.html?return=' + encodeURIComponent('profile.html');
      return null;
    }
    return Promise.all([
      Promise.resolve(member),
      FlowDB.getAll('activities'),
      FlowDB.getAllByIndex('participations', 'memberId', member.id),
    ]);
  }).then(function(result){
    if (!result) return;
    var member = result[0], activities = result[1], participations = result[2];
    var byId = {};
    for (var i = 0; i < activities.length; i++) byId[activities[i].id] = activities[i];
    render(member, byId, participations);
  });
})();
