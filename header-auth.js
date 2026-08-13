/* =========================================================
   عرض حالة الدخول في الهيدر (مشترك بين كل الصفحات)
   ========================================================= */
(function(){
  function levelBadgeColor(levelName){
    var map = {
      'Beginner': '#8B90A0', 'Explorer': '#2CA6A4', 'Communicator': '#7C6FE0',
      'Ambassador': '#FFB347', 'Language Champion': '#F2661F',
    };
    return map[levelName] || '#8B90A0';
  }

  function render(){
    var slot = document.getElementById('authSlot');
    if (!slot) return;
    FlowDB.seedIfEmpty().then(function(){
      return FlowAuth.currentMember();
    }).then(function(member){
      if (!member) {
        slot.innerHTML = '<a href="login.html" class="btn btn-ghost" style="padding:9px 18px; font-size:13px;">Se connecter</a>';
        return;
      }
      var lvl = FlowDB.levelFor(member.points || 0);
      var roleIcon = member.role === 'trainer' ? '🎓' : '🧑‍🎓';
      var adminLink = FlowAuth.isAdmin(member) ? '<a href="admin.html" class="icon-btn" title="Administration" style="text-decoration:none;">⚙️</a>' : '';
      slot.innerHTML =
        adminLink +
        '<a href="profile.html" class="auth-chip">' +
          '<span class="auth-avatar">' + member.name.charAt(0).toUpperCase() + '</span>' +
          '<span class="auth-info">' +
            '<b>' + roleIcon + ' ' + member.name + '</b>' +
            '<small style="color:' + levelBadgeColor(lvl.current.name) + '">' + (member.points || 0) + ' pts · ' + lvl.current.name + '</small>' +
          '</span>' +
        '</a>';
    })['catch'](function(){
      slot.innerHTML = '<a href="login.html" class="btn btn-ghost" style="padding:9px 18px; font-size:13px;">Se connecter</a>';
    });
  }

  document.addEventListener('DOMContentLoaded', render);
  window.FlowHeaderAuth = { refresh: render };
})();
