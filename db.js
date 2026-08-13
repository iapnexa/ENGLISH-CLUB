/* =========================================================
   FlowDB — طبقة تخزين محلية (IndexedDB) بواجهة شبيهة بـ Realm
   Collections: members · activities · events · participations · pollVotes
   ========================================================= */
var FlowDB = (function(){
  var DB_NAME = 'flowtalk_db';
  var DB_VERSION = 4;
  var dbPromise = null;

  var SEED_ACTIVITIES = [
    { id: 'conversation', icon: '💬', title: 'Conversation Sessions', short: 'Pratiquez l\u2019anglais dans une ambiance conviviale.', detail: 'Des sessions hebdomadaires informelles où les membres pratiquent l\u2019anglais parlé autour de sujets variés — actualité, vie professionnelle, culture générale. Idéal pour gagner en aisance sans pression.', schedule: 'Chaque mardi · 15:00 – 16:00', points: 10 },
    { id: 'presentations', icon: '🎤', title: 'Presentations & Talks', short: 'Développez vos compétences en prise de parole.', detail: 'Apprenez à structurer et délivrer une présentation professionnelle en anglais : ouverture percutante, langage corporel, gestion du stress et Q&A.', schedule: '1 fois par mois · 15:00 – 17:00', points: 10 },
    { id: 'debates', icon: '🗣️', title: 'Debates', short: 'Exprimez votre avis, écoutez, argumentez.', detail: 'Des débats structurés sur des sujets technologiques, énergétiques et de société. Vous apprenez à construire un argumentaire clair et à réagir à la contradiction — en anglais uniquement.', schedule: 'Toutes les 2 semaines · 16:00 – 17:00', points: 10 },
    { id: 'games', icon: '🎮', title: 'Games & Challenges', short: 'Apprenez en vous amusant !', detail: 'Jeux de vocabulaire, quiz éclair, charades en anglais... Une manière ludique et détendue de progresser tout en créant des liens avec les autres membres.', schedule: 'Chaque vendredi · 15:00 – 16:00', points: 8 },
    { id: 'bookclub', icon: '📖', title: 'Book Club', short: 'Read. Share. Inspire.', detail: 'Un livre (ou article) est choisi chaque mois. Les membres se retrouvent pour en discuter, partager leurs impressions et enrichir leur vocabulaire littéraire.', schedule: '1 fois par mois · 16:00 – 17:00', points: 10 },
    { id: 'movienights', icon: '🎬', title: 'Movie Nights & Discussions', short: 'Watch. Discuss. Learn.', detail: 'Projection d\u2019un extrait ou court-métrage en anglais suivie d\u2019une discussion guidée — excellent exercice de compréhension orale et d\u2019expression spontanée.', schedule: '1 fois par mois · 17:00 – 19:00', points: 10 },
    { id: 'writing', icon: '✍️', title: 'Writing Corner', short: 'Écrivez. Partagez. Progressez.', detail: 'Atelier d\u2019écriture : emails professionnels, rapports techniques, ou écriture créative. Retours personnalisés sur la clarté et la structure de vos textes.', schedule: 'Toutes les 2 semaines · 15:00 – 16:00', points: 8 },
    { id: 'idealab', icon: '💡', title: 'Idea Lab', short: 'Innovate. Pitch. Make it real.', detail: 'Un espace pour proposer et développer des idées de projets (techniques ou communautaires) et s\u2019entraîner à les présenter clairement en anglais.', schedule: '1 fois par mois · 15:00 – 17:00', points: 12 },
    { id: 'competitions', icon: '🏆', title: 'Competitions & Quizzes', short: 'Test your knowledge. Win prizes!', detail: 'Des quiz compétitifs par équipes sur la culture générale, la technologie et l\u2019anglais — avec des récompenses pour les meilleures équipes.', schedule: 'Trimestriel', points: 15 },
    { id: 'coaching', icon: '🤝', title: 'Peer Coaching', short: 'Help others. Grow together.', detail: 'Les membres plus avancés accompagnent les nouveaux membres en binôme. Une belle occasion de consolider ses acquis en aidant les autres.', schedule: 'Sur demande', points: 12 },
  ];

  var SEED_EVENTS = [
    { id: 'ev1', day: '27', month: 'Juin', title: 'FlowTalk Opening Session', desc: 'Get to know the club & icebreaker activities', time: '15:00 – 17:00' },
    { id: 'ev2', day: '04', month: 'Juil.', title: 'Speak & Share', desc: 'Talk about your field in English', time: '15:00 – 17:00' },
    { id: 'ev3', day: '11', month: 'Juil.', title: 'Energy Debates', desc: 'Debate. Defend. Grow.', time: '15:00 – 17:00' },
  ];

  function open(){
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function(resolve, reject){
      if (!window.indexedDB) { reject(new Error('IndexedDB non disponible')); return; }
      var settled = false;
      var timeout = setTimeout(function(){
        if (!settled) { settled = true; reject(new Error('Délai dépassé lors de l\u2019ouverture de la base locale')); }
      }, 4000);
      var req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function(e){
        var db = e.target.result;
        if (!db.objectStoreNames.contains('members')) {
          var m = db.createObjectStore('members', { keyPath: 'id', autoIncrement: true });
          m.createIndex('email', 'email', { unique: true });
        }
        if (!db.objectStoreNames.contains('activities')) db.createObjectStore('activities', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('events')) db.createObjectStore('events', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('participations')) {
          var p = db.createObjectStore('participations', { keyPath: 'id', autoIncrement: true });
          p.createIndex('memberId', 'memberId', { unique: false });
          p.createIndex('activityId', 'activityId', { unique: false });
        }
        if (!db.objectStoreNames.contains('pollVotes')) db.createObjectStore('pollVotes', { keyPath: 'id', autoIncrement: true });
        if (!db.objectStoreNames.contains('trainerEnrollments')) {
          var t = db.createObjectStore('trainerEnrollments', { keyPath: 'id', autoIncrement: true });
          t.createIndex('memberId', 'memberId', { unique: true });
        }
        if (!db.objectStoreNames.contains('lessons')) db.createObjectStore('lessons', { keyPath: 'id', autoIncrement: true });
        if (!db.objectStoreNames.contains('siteConfig')) db.createObjectStore('siteConfig', { keyPath: 'key' });
        if (!db.objectStoreNames.contains('adminAuth')) db.createObjectStore('adminAuth', { keyPath: 'email' });
      };
      req.onsuccess = function(e){
        if (settled) return;
        settled = true; clearTimeout(timeout);
        resolve(e.target.result);
      };
      req.onerror = function(e){
        if (settled) return;
        settled = true; clearTimeout(timeout);
        reject(e.target.error);
      };
    });
    return dbPromise;
  }

  function tx(storeName, mode){
    return open().then(function(db){
      return db.transaction(storeName, mode || 'readonly').objectStore(storeName);
    });
  }

  function put(storeName, value){
    return tx(storeName, 'readwrite').then(function(store){
      return new Promise(function(resolve, reject){
        var req = store.put(value);
        req.onsuccess = function(){ resolve(req.result); };
        req.onerror = function(){ reject(req.error); };
      });
    });
  }

  function get(storeName, key){
    return tx(storeName, 'readonly').then(function(store){
      return new Promise(function(resolve, reject){
        var req = store.get(key);
        req.onsuccess = function(){ resolve(req.result || null); };
        req.onerror = function(){ reject(req.error); };
      });
    });
  }

  function getAll(storeName){
    return tx(storeName, 'readonly').then(function(store){
      return new Promise(function(resolve, reject){
        var req = store.getAll();
        req.onsuccess = function(){ resolve(req.result || []); };
        req.onerror = function(){ reject(req.error); };
      });
    });
  }

  function getAllByIndex(storeName, indexName, value){
    return tx(storeName, 'readonly').then(function(store){
      return new Promise(function(resolve, reject){
        var req = store.index(indexName).getAll(value);
        req.onsuccess = function(){ resolve(req.result || []); };
        req.onerror = function(){ reject(req.error); };
      });
    });
  }

  function del(storeName, key){
    return tx(storeName, 'readwrite').then(function(store){
      return new Promise(function(resolve, reject){
        var req = store.delete(key);
        req.onsuccess = function(){ resolve(); };
        req.onerror = function(){ reject(req.error); };
      });
    });
  }

  function seedIfEmpty(){
    return getAll('activities').then(function(rows){
      if (rows.length) return;
      return Promise.all(SEED_ACTIVITIES.map(function(a){ return put('activities', a); }));
    }).then(function(){
      return getAll('events');
    }).then(function(rows){
      if (rows.length) return;
      return Promise.all(SEED_EVENTS.map(function(e){ return put('events', e); }));
    });
  }

  /* ---- منطق النقاط والمستويات (يطابق وثيقة المتطلبات) ---- */
  var LEVELS = [
    { name: 'Beginner', min: 0 },
    { name: 'Explorer', min: 50 },
    { name: 'Communicator', min: 150 },
    { name: 'Ambassador', min: 300 },
    { name: 'Language Champion', min: 500 },
  ];
  function levelFor(points){
    var current = LEVELS[0];
    for (var i = 0; i < LEVELS.length; i++) {
      if (points >= LEVELS[i].min) current = LEVELS[i];
    }
    var next = null;
    for (var j = 0; j < LEVELS.length; j++) {
      if (LEVELS[j].min > points) { next = LEVELS[j]; break; }
    }
    return { current: current, next: next };
  }

  var TRAINER_MODULES = [
    { id: 'classroom', icon: '🎓', title: 'Classroom & Instructional English', desc: 'Vocabulaire et structures pour animer un cours : consignes, transitions, gestion du temps et du groupe.', duration: '3 séances · 1h30' },
    { id: 'vocab', icon: '🛠️', title: 'Technical Vocabulary in English', desc: 'Vocabulaire spécifique par filière : forage, HSE, géologie, mécanique, production.', duration: '4 séances · 1h30' },
    { id: 'presenting', icon: '🎤', title: 'Presenting & Explaining Concepts', desc: 'Expliquer un schéma, une procédure ou un résultat technique clairement et avec assurance.', duration: '3 séances · 1h30' },
    { id: 'questions', icon: '❓', title: 'Handling Questions & Discussions', desc: 'Gérer les questions des stagiaires, reformuler, clarifier et rebondir en anglais.', duration: '2 séances · 1h30' },
    { id: 'writing', icon: '📝', title: 'Writing Training Materials in English', desc: 'Rédiger supports de cours, exercices et évaluations en anglais clair et structuré.', duration: '3 séances · 1h30' },
  ];

  function enroll(memberId){
    return getAllByIndex('trainerEnrollments', 'memberId', memberId).then(function(rows){
      if (rows && rows.length) return rows[0];
      var record = { memberId: memberId, enrolledAt: new Date().toISOString(), completedModules: [] };
      return put('trainerEnrollments', record).then(function(id){ record.id = id; return record; });
    });
  }

  function toggleModule(enrollment, moduleId){
    var list = enrollment.completedModules || [];
    var idx = list.indexOf(moduleId);
    if (idx === -1) list.push(moduleId); else list.splice(idx, 1);
    enrollment.completedModules = list;
    return put('trainerEnrollments', enrollment).then(function(){ return enrollment; });
  }

  function getWeeklyTopic(){
    return get('siteConfig', 'weeklyTopic').then(function(row){
      return row ? row.value : { title: 'Resilience', desc: 'The ability to adapt and keep moving forward, even after setbacks.' };
    });
  }
  function setWeeklyTopic(value){
    return put('siteConfig', { key: 'weeklyTopic', value: value });
  }

  return {
    open: open, put: put, get: get, getAll: getAll,
    getAllByIndex: getAllByIndex, del: del,
    seedIfEmpty: seedIfEmpty, levelFor: levelFor, LEVELS: LEVELS,
    TRAINER_MODULES: TRAINER_MODULES, enroll: enroll, toggleModule: toggleModule,
    getWeeklyTopic: getWeeklyTopic, setWeeklyTopic: setWeeklyTopic,
  };
})();
