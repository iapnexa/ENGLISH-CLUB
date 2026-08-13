/* =========================================================
   منطق صفحة "Formation des Formateurs" — English for Trainers
   ========================================================= */
(function(){
  var enrollArea = document.getElementById('enrollArea');
  var modulesList = document.getElementById('modulesList');
  var statsText = document.getElementById('statsText');

  var currentMember = null;
  var currentEnrollment = null; // null = غير مسجّل في البرنامج

  function renderEnrollArea(){
    if (!currentMember) {
      enrollArea.innerHTML = '<a href="login.html?return=' + encodeURIComponent('trainers.html') + '" class="btn btn-primary">Se connecter pour s\u2019inscrire</a>';
      return;
    }
    if (currentEnrollment) {
      var done = (currentEnrollment.completedModules || []).length;
      var total = FlowDB.TRAINER_MODULES.length;
      enrollArea.innerHTML =
        '<span class="btn btn-ghost" style="cursor:default;">✓ Inscrit(e) au programme — ' + done + '/' + total + ' modules complétés</span>';
    } else {
      enrollArea.innerHTML = '<button class="btn btn-primary" id="enrollBtn">Rejoindre le programme</button>';
      document.getElementById('enrollBtn').addEventListener('click', function(){
        FlowDB.enroll(currentMember.id).then(function(enr){
          currentEnrollment = enr;
          renderEnrollArea();
          renderModules();
          refreshStats();
        });
      });
    }
  }

  function renderModules(){
    var modules = FlowDB.TRAINER_MODULES;
    var html = '';
    for (var i = 0; i < modules.length; i++) {
      var m = modules[i];
      var isDone = currentEnrollment && (currentEnrollment.completedModules || []).indexOf(m.id) !== -1;
      var checkHtml;
      if (!currentMember) {
        checkHtml = '';
      } else if (!currentEnrollment) {
        checkHtml = '<span style="font-size:11.5px; color:var(--dim);">Inscrivez-vous pour suivre votre progression</span>';
      } else {
        checkHtml =
          '<label class="module-check' + (isDone ? ' done' : '') + '" data-module="' + m.id + '">' +
            '<input type="checkbox" ' + (isDone ? 'checked' : '') + '> ' + (isDone ? 'Complété' : 'Marquer comme fait') +
          '</label>';
      }
      html += '' +
        '<div class="module-row">' +
          '<div class="ic">' + m.icon + '</div>' +
          '<div style="flex:1;">' +
            '<h4>' + m.title + '</h4>' +
            '<p>' + m.desc + '</p>' +
            '<span class="duration">' + m.duration + '</span>' +
          '</div>' +
          checkHtml +
        '</div>';
    }
    modulesList.innerHTML = html;

    if (currentEnrollment) {
      var checks = modulesList.querySelectorAll('.module-check');
      for (var j = 0; j < checks.length; j++) {
        checks[j].addEventListener('click', function(e){
          e.preventDefault();
          var moduleId = this.getAttribute('data-module');
          FlowDB.toggleModule(currentEnrollment, moduleId).then(function(enr){
            currentEnrollment = enr;
            renderEnrollArea();
            renderModules();
          });
        });
      }
    }
  }

  function refreshStats(){
    FlowDB.getAll('trainerEnrollments').then(function(rows){
      var count = rows.length;
      statsText.innerHTML = '<b style="color:var(--orange); font-size:20px; font-family:\'Poppins\',sans-serif;">' + count + '</b><br>formateur' + (count === 1 ? '' : 's') + ' inscrit' + (count === 1 ? '' : 's') + ' au programme';
    });
  }

  FlowDB.seedIfEmpty().then(function(){
    return FlowAuth.currentMember();
  }).then(function(member){
    currentMember = member;
    if (!member) { renderEnrollArea(); renderModules(); refreshStats(); return; }
    return FlowDB.getAllByIndex('trainerEnrollments', 'memberId', member.id).then(function(rows){
      currentEnrollment = (rows && rows.length) ? rows[0] : null;
      renderEnrollArea();
      renderModules();
      refreshStats();
    });
  })['catch'](function(){
    statsText.textContent = 'Indisponible sur ce navigateur.';
    modulesList.innerHTML = '<p style="color:var(--dim); font-size:13px;">Impossible de charger les modules pour le moment. Réessayez depuis un navigateur récent (Chrome, Firefox, Edge, Safari).</p>';
    enrollArea.innerHTML = '';
  });
})();
