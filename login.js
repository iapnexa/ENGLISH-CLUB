/* =========================================================
   منطق صفحة تسجيل الدخول / إنشاء الحساب
   ========================================================= */
(function(){
  var form = document.getElementById('authForm');
  var errorBox = document.getElementById('authError');
  var submitBtn = document.getElementById('authSubmit');
  var roleChoice = document.getElementById('roleChoice');
  var structureField = document.getElementById('structureField');
  var structureInput = document.getElementById('structureInput');
  var selectedRole = 'trainee';

  function updateStructureVisibility(){
    structureField.style.display = (selectedRole === 'trainee') ? 'block' : 'none';
  }
  updateStructureVisibility();

  var roleCards = roleChoice.querySelectorAll('.role-card');
  for (var i = 0; i < roleCards.length; i++) {
    roleCards[i].addEventListener('click', function(){
      for (var j = 0; j < roleCards.length; j++) roleCards[j].classList.remove('active');
      this.classList.add('active');
      selectedRole = this.getAttribute('data-role');
      updateStructureVisibility();
    });
  }

  // إن كان هناك عضو مسجل الدخول بالفعل، أعده مباشرة لوجهته المناسبة
  FlowDB.seedIfEmpty().then(function(){ return FlowAuth.currentMember(); }).then(function(member){
    if (member) window.location.href = getReturnUrl(member);
  });

  function getReturnUrl(member){
    var params = new URLSearchParams(window.location.search);
    var explicit = params.get('return');
    if (explicit) return explicit;
    return (member && member.role === 'trainer') ? 'trainers.html' : 'index.html';
  }

  form.addEventListener('submit', function(e){
    e.preventDefault();
    var name = document.getElementById('nameInput').value.trim();
    var email = document.getElementById('emailInput').value.trim();
    var structure = structureInput.value.trim();
    if (!name || !email) {
      errorBox.style.display = 'block';
      return;
    }
    errorBox.style.display = 'none';
    submitBtn.textContent = 'Connexion en cours…';
    submitBtn.disabled = true;

    FlowAuth.registerOrLogin(name, email, selectedRole, structure).then(function(member){
      window.location.href = getReturnUrl(member);
    })['catch'](function(){
      errorBox.textContent = 'Une erreur est survenue. Réessayez.';
      errorBox.style.display = 'block';
      submitBtn.textContent = 'Continuer';
      submitBtn.disabled = false;
    });
  });
})();
