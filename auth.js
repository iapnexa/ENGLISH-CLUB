/* =========================================================
   FlowAuth — تسجيل / دخول بسيط للأعضاء (محلي بالكامل عبر FlowDB)
   ========================================================= */
var FlowAuth = (function(){
  var SESSION_KEY = 'ft-session-member-id';

  function safeGet(k){ try { return localStorage.getItem(k); } catch(e){ return null; } }
  function safeSet(k,v){ try { localStorage.setItem(k,v); } catch(e){} }
  function safeRemove(k){ try { localStorage.removeItem(k); } catch(e){} }

  function currentId(){
    var raw = safeGet(SESSION_KEY);
    return raw ? parseInt(raw, 10) : null;
  }

  function currentMember(){
    var id = currentId();
    if (!id) return Promise.resolve(null);
    return FlowDB.get('members', id);
  }

  function findByEmail(email){
    return FlowDB.getAllByIndex('members', 'email', email).then(function(rows){
      return rows && rows.length ? rows[0] : null;
    });
  }

  /* تسجيل عضو جديد أو الدخول التلقائي إذا كان البريد موجوداً مسبقاً */
  function registerOrLogin(name, email, role, structure){
    email = (email || '').trim().toLowerCase();
    name = (name || '').trim();
    if (!email || !name) return Promise.reject(new Error('missing_fields'));

    return findByEmail(email).then(function(existing){
      if (existing) {
        var changed = false;
        if (role && !existing.role) { existing.role = role; changed = true; }
        if (structure && !existing.structure) { existing.structure = structure; changed = true; }
        if (changed) {
          return FlowDB.put('members', existing).then(function(){
            safeSet(SESSION_KEY, String(existing.id));
            return existing;
          });
        }
        safeSet(SESSION_KEY, String(existing.id));
        return existing;
      }
      var member = {
        name: name, email: email, points: 0, role: role || 'trainee',
        structure: structure || '', joinedAt: new Date().toISOString(),
      };
      return FlowDB.put('members', member).then(function(id){
        member.id = id;
        safeSet(SESSION_KEY, String(id));
        return member;
      });
    });
  }

  function logout(){
    safeRemove(SESSION_KEY);
  }

  function addPoints(memberId, delta){
    return FlowDB.get('members', memberId).then(function(member){
      if (!member) return null;
      member.points = Math.max(0, (member.points || 0) + delta);
      return FlowDB.put('members', member).then(function(){ return member; });
    });
  }

  function isAdmin(member){
    if (!member || !member.email) return false;
    var list = (window.FLOW_ADMIN_EMAILS || []).map(function(e){ return e.toLowerCase(); });
    return list.indexOf(member.email.toLowerCase()) !== -1;
  }

  return { currentId: currentId, currentMember: currentMember, registerOrLogin: registerOrLogin, logout: logout, addPoints: addPoints, isAdmin: isAdmin };
})();
