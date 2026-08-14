/* =========================================================
   منطق صفحة تفاصيل النشاط: عرض + الانضمام/الإلغاء + النقاط
   ========================================================= */
(function(){
  var content = document.getElementById('activityContent');
  var params = new URLSearchParams(window.location.search);
  var activityId = params.get('id');

  if (!activityId) {
    content.innerHTML = '<div class="container" style="padding-bottom:100px;"><p>Activité introuvable.</p></div>';
    return;
  }

  var currentActivity = null;
  var currentMember = null;
  var currentParticipation = null;

  function iconTile(){
    return '<div class="ic-lg">' + currentActivity.icon + '</div>';
  }

  function joinButtonHtml(){
    if (!currentMember) {
      return '<a href="login.html?return=' + encodeURIComponent('activity.html?id=' + activityId) + '" class="btn btn-primary btn-block">Se connecter pour rejoindre</a>';
    }
    if (currentParticipation) {
      return '<button class="btn btn-ghost btn-block" id="joinBtn">✓ Inscrit — Se désinscrire</button>';
    }
    return '<button class="btn btn-primary btn-block" id="joinBtn">Rejoindre cette activité (+' + currentActivity.points + ' pts)</button>';
  }

  function render(){
    content.innerHTML =
      '<section class="activity-hero container">' +
        iconTile() +
        '<div>' +
          '<div class="eyebrow">Nos Activités</div>' +
          '<h1 style="font-size:clamp(24px,3.4vw,36px); font-family:\'Poppins\',sans-serif; font-weight:800;">' + currentActivity.title + '</h1>' +
          '<p style="color:var(--dim); margin-top:6px;">' + currentActivity.short + '</p>' +
        '</div>' +
      '</section>' +
      '<section class="container activity-detail-grid">' +
        '<div class="panel">' +
          '<div class="panel-head"><h3>Description</h3></div>' +
          '<p style="color:var(--dim); font-size:14.5px; line-height:1.8;">' + currentActivity.detail + '</p>' +
        '</div>' +
        '<div class="col">' +
          '<div class="panel">' +
            '<div class="panel-head"><h3>📅 Planning</h3></div>' +
            '<p style="font-size:14px; font-weight:600;">' + currentActivity.schedule + '</p>' +
            '<p style="color:var(--dim); font-size:12.5px; margin-top:10px;">Récompense de participation : <b style="color:var(--orange);">+' + currentActivity.points + ' points</b></p>' +
          '</div>' +
          '<div class="panel" id="joinPanel">' + joinButtonHtml() + '</div>' +
        '</div>' +
      '</section>';

    var joinBtn = document.getElementById('joinBtn');
    if (joinBtn) joinBtn.addEventListener('click', onJoinToggle);
  }

  function onJoinToggle(){
    if (currentParticipation) {
      // إلغاء التسجيل: حذف المشاركة وخصم النقاط
      FlowDB.del('participations', currentParticipation.id).then(function(){
        return FlowAuth.addPoints(currentMember.id, -currentActivity.points);
      }).then(function(updated){
        currentMember = updated;
        currentParticipation = null;
        render();
        if (window.FlowHeaderAuth) window.FlowHeaderAuth.refresh();
      });
    } else {
      var record = { memberId: currentMember.id, activityId: currentActivity.id, joinedAt: new Date().toISOString(), points: currentActivity.points };
      FlowDB.put('participations', record).then(function(id){
        record.id = id;
        return FlowAuth.addPoints(currentMember.id, currentActivity.points);
      }).then(function(updated){
        currentMember = updated;
        currentParticipation = record;
        render();
        if (window.FlowHeaderAuth) window.FlowHeaderAuth.refresh();
      });
    }
  }

  FlowDB.seedIfEmpty().then(function(){
    return FlowDB.get('activities', activityId);
  }).then(function(activity){
    if (!activity) {
      content.innerHTML = '<div class="container" style="padding-bottom:100px;"><p>Activité introuvable.</p></div>';
      return null;
    }
    currentActivity = activity;
    document.title = activity.title + ' — IAP FlowTalk English Club';
    return FlowAuth.currentMember();
  }).then(function(member){
    if (!currentActivity) return;
    currentMember = member;
    if (!member) { render(); return; }
    return FlowDB.getAllByIndex('participations', 'memberId', member.id).then(function(rows){
      for (var i = 0; i < rows.length; i++) {
        if (rows[i].activityId === currentActivity.id) { currentParticipation = rows[i]; break; }
      }
      render();
    });
  });
})();
