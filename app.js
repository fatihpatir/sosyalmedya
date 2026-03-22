const app = {
  activeExam: null,
  score: 0,
  timer: null,
  timeLeft: 0,
  progress: JSON.parse(localStorage.getItem('sosyal_progress')) || {},
  soundEnabled: JSON.parse(localStorage.getItem('sosyal_sound')) !== false,
  audioCtx: null,
  
  init() {
    this.initAudio();
    this.renderHome();
  },

  initAudio() {
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.updateSoundBtn();
  },

  playTone(freq, type, duration, vol = 0.1) {
    if (!this.soundEnabled || !this.audioCtx) return;
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
    gain.gain.setValueAtTime(vol, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + duration);
    osc.connect(gain); gain.connect(this.audioCtx.destination);
    osc.start(); osc.stop(this.audioCtx.currentTime + duration);
  },

  playSound(type) {
    switch(type) {
      case 'click': this.playTone(800, 'sine', 0.1, 0.05); break;
      case 'success': this.playTone(600, 'sine', 0.1); setTimeout(() => this.playTone(900, 'sine', 0.2), 100); break;
      case 'fail': this.playTone(300, 'sawtooth', 0.2, 0.05); setTimeout(() => this.playTone(200, 'sawtooth', 0.3, 0.05), 150); break;
      case 'win': [440, 554, 659, 880].forEach((f, i) => setTimeout(() => this.playTone(f, 'sine', 0.4, 0.1), i * 150)); break;
    }
  },

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    localStorage.setItem('sosyal_sound', this.soundEnabled);
    this.updateSoundBtn(); if (this.soundEnabled) this.playSound('click');
  },

  updateSoundBtn() {
    const btn = document.getElementById('btn-sound');
    if (btn) btn.innerText = this.soundEnabled ? '🔊' : '🔇';
  },

  renderHome() {
    const grid = document.getElementById('exam-grid');
    grid.innerHTML = '';
    const allCards = window.EXAM_DATA.flatMap(e => e.flashcards);
    const fact = allCards[Math.floor(Math.random()*allCards.length)];
    grid.innerHTML = `<div class="q-card" style="grid-column: 1 / -1; margin-bottom: 2.5rem; border:2px solid var(--primary);"><div class="q-num">💡 TREND ÖZETİ</div><p class="q-text" style="font-size:1.4rem;">${fact.front}</p><p class="a-text">${fact.back}</p></div>`;
    
    window.EXAM_DATA.forEach(exam => {
      const isDone = this.progress[exam.id]?.study;
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div class="card-icon">${this.getIcon(exam.id)}</div>
        <h3 class="card-title">${exam.title}</h3>
        <p class="card-desc">Sosyal Medya ve E-Ticaret Dünyası.</p>
        ${isDone ? '<span style="background:var(--grad); -webkit-background-clip:text; -webkit-text-fill-color:transparent; font-size:0.75rem; font-weight:800; margin-top:12px;">STRATEGY COMPLETED ✅</span>' : ''}
      `;
      card.onclick = () => this.showSelection(exam);
      grid.appendChild(card);
    });
  },

  getIcon(id) {
    const icons = { '1-1': '🛒', '1-2': '🛡️', '2-1': '📊', '2-2': '📈' };
    return icons[id] || '🌐';
  },

  showView(id) {
    this.playSound('click');
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    window.scrollTo(0,0);
  },

  showHome() { this.activeExam = null; this.showView('view-home'); this.renderHome(); },

  showSelection(exam) {
    this.activeExam = exam;
    document.getElementById('selected-title').innerText = exam.title;
    this.showView('view-selection');
    this.renderBadges();
  },

  startSummary() {
    const c = document.getElementById('content-container');
    c.innerHTML = `
      <div class="game-container" style="text-align:left;">
        <h2 style="text-align:center; margin-bottom:2.5rem; color:var(--primary);">📖 ${this.activeExam.title} ÖZETİ</h2>
        <div class="q-card" style="line-height:1.8; font-size:1.2rem; border-left:6px solid var(--accent); background:#0a0a0d;">
          ${this.activeExam.summary}
        </div>
        <div style="text-align:center; margin-top:2.5rem; display:flex; justify-content:center; gap:1rem; flex-wrap:wrap;">
          <button class="btn" onclick="app.startStudy()">📚 TÜM NOTLARA GİT</button>
          <button class="btn btn-secondary" onclick="app.printSummary()">🖨️ ÖZETİ PDF İNDİR</button>
        </div>
      </div>
    `;
    this.showView('view-content');
  },

  startOpenEnded() {
    const c = document.getElementById('content-container');
    c.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2.5rem; flex-wrap:wrap;">
          <h2 style="color:var(--accent); margin:0;">${this.activeExam.title} / Açık Uçlu</h2>
          <button class="btn btn-secondary" style="padding:0.7rem 1.2rem; font-size:0.7rem;" onclick="app.printOpenEnded()">🖨️ PDF İNDİR</button>
      </div>
      ${this.activeExam.openEnded.map((q, i) => `<div class="q-card" style="margin-bottom:2rem;"><div class="q-num">SORU ${i+1}</div><p class="q-text" style="font-weight:bold; font-size:1.1rem; margin-bottom:1rem; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:10px;">${q.q}</p><p class="a-text" style="color:var(--accent); line-height:1.6; font-size:1.05rem;"><strong style="color:#fff;">Cevap:</strong> ${q.a}</p></div>`).join('')}
    `;
    this.saveProgress('openEnded');
    this.showView('view-content');
  },

  startStudy() {
    const c = document.getElementById('content-container');
    c.innerHTML = `<h2 style="margin-bottom:2.5rem;">${this.activeExam.title} / Arşiv</h2>${this.activeExam.questions.map((q, i) => `<div class="q-card"><div class="q-num">METRİK ${i+1}</div><p class="q-text">${q.q}</p><p class="a-text">${q.a}</p></div>`).join('')}`;
    this.saveProgress('study');
    this.showView('view-content');
  },

  startFlashcards() {
    const c = document.getElementById('content-container');
    c.innerHTML = `<div class="fc-grid">${this.activeExam.flashcards.map(f => `<div class="fc-card" onclick="this.classList.toggle('flipped')"><div class="fc-inner"><div class="fc-front">${f.front}</div><div class="fc-back">${f.back}</div></div></div>`).join('')}</div>`;
    this.saveProgress('flash');
    this.showView('view-content');
  },

  startGame(type) {
    this.score = 0;
    this.showView('view-content');
    if(type === 'tf') this.playTF();
    else if(type === 'word') this.playWord();
    else if(type === 'time') this.playTime();
    else if(type === 'test') this.playTest();
  },

  playTF() {
    const q = this.activeExam.questions[Math.floor(Math.random()*this.activeExam.questions.length)];
    const isCorrect = Math.random() > 0.5;
    const ans = isCorrect ? q.a : this.activeExam.questions[Math.floor(Math.random()*this.activeExam.questions.length)].a;
    const c = document.getElementById('content-container');
    c.innerHTML = `<div class="game-container"><h3>Doğrulama Kontrolü</h3><div class="q-card" style="margin-top:2rem;"><p class="q-text">${q.q}</p><p class="a-text" style="color:var(--accent); font-weight:700;">Bilgi: ${ans}</p></div><div style="display:flex; gap:1.5rem; justify-content:center; margin-top:2.5rem;"><button class="btn" onclick="app.checkTF(true, ${ans === q.a})">DOĞRU</button><button class="btn btn-secondary" onclick="app.checkTF(false, ${ans === q.a})">YANLIŞ</button></div></div>`;
  },

  checkTF(p, c) { if(p === c) { this.playSound('success'); this.score++; this.playTF(); } else { this.playSound('fail'); this.endGame('Engagement Lost!', `Skor: ${this.score}`); } },

  playWord() {
    const q = this.activeExam.questions[Math.floor(Math.random()*this.activeExam.questions.length)];
    const word = q.a.toUpperCase().replace(/[.,]/g,'');
    let hidden = word.split('').map(c => c === ' ' ? ' ' : '_').join('');
    const c = document.getElementById('content-container');
    c.innerHTML = `<div class="game-container"><h3>Terim Tahmini</h3><p style="margin-bottom:2rem; font-size:1.1rem; opacity:0.8;">${q.q}</p><div class="word-display" id="word-box">${hidden}</div><div class="keyboard">${"ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ".split('').map(l => `<button class="key" onclick="app.guess('${l}','${word}',this)">${l}</button>`).join('')}</div></div>`;
  },

  guess(l, w, b) {
    this.playSound('click');
    b.classList.add('used');
    const box = document.getElementById('word-box');
    let curr = box.innerText.split('');
    w.split('').forEach((c, i) => { if(c === l) { curr[i] = l; } });
    box.innerText = curr.join('');
    if(!curr.includes('_')) { this.playSound('win'); this.saveProgress('game'); this.endGame('Viral Başarı!', `Kelime: ${w}`); this.triggerConfetti(); }
    else if(!w.includes(l)) { this.playSound('fail'); } else { this.playSound('success'); }
  },

  playTime() {
    this.timeLeft = 60;
    this.timer = setInterval(() => {
      this.timeLeft--;
      document.getElementById('game-status').innerText = `⏱️ ${this.timeLeft}s | 📈 ${this.score}`;
      if(this.timeLeft <= 0) { clearInterval(this.timer); this.endGame('Time Out!', `Final Skor: ${this.score}`); }
    }, 1000);
    this.nextTimeQ();
  },

  nextTimeQ() {
    const q = this.activeExam.questions[Math.floor(Math.random()*this.activeExam.questions.length)];
    const opts = [q.a, ...this.activeExam.questions.filter(x => x.a !== q.a).map(x => x.a).sort(() => 0.5-Math.random()).slice(0,2)].sort(() => 0.5-Math.random());
    const c = document.getElementById('content-container');
    c.innerHTML = `<div class="game-container"><div class="q-card"><p class="q-text">${q.q}</p></div><div style="display:grid; gap:12px; margin-top:1.5rem;">${opts.map(o => `<button class="btn btn-secondary" onclick="app.checkTimeQ('${o}','${q.a}')">${o}</button>`).join('')}</div></div>`;
  },

  checkTimeQ(p, c) { if(p === c) { this.playSound('success'); this.score++; } else { this.playSound('fail'); } this.nextTimeQ(); },

  endGame(t, m) {
    clearInterval(this.timer);
    document.getElementById('game-status').innerText = '';
    const b = document.getElementById('result-body');
    b.innerHTML = `<h2 style="color:var(--primary); margin-bottom:1.5rem;">${t}</h2><p style="font-size:1.8rem; margin-bottom:2.5rem; font-weight:700;">${m}</p><button class="btn" onclick="app.closeModal()">KAPAT</button>`;
    if(t.includes('Viral') || t.includes('Loss') || t.includes('Time')) this.playSound('win');
    document.getElementById('modal-result').classList.add('active');
  },

  closeModal() { document.getElementById('modal-result').classList.remove('active'); this.showSelection(this.activeExam); },

  saveProgress(type) {
    if(!this.progress[this.activeExam.id]) this.progress[this.activeExam.id] = {};
    this.progress[this.activeExam.id][type] = true;
    localStorage.setItem('sosyal_progress', JSON.stringify(this.progress));
    this.showToast('Yeni bir başarı kilidi açıldı! 🔓');
  },

  renderBadges() {
    const c = document.getElementById('badges');
    const types = ['openEnded', 'study', 'flash', 'game'];
    const icons = { openEnded: '🧠', study: '📚', flash: '🎴', game: '🎮' };
    c.innerHTML = types.map(t => `<span class="badge ${this.progress[this.activeExam.id]?.[t] ? 'earned' : ''}" style="padding:8px 15px; border-radius:20px; border:1px solid var(--glass-border); margin-right:8px; display:inline-block; font-size:1.1rem; filter: grayscale(${this.progress[this.activeExam.id]?.[t] ? 0 : 1}); opacity: ${this.progress[this.activeExam.id]?.[t] ? 1 : 0.3}"> ${icons[t]}</span>`).join('');
  },

  printSummary() {
    const a = document.getElementById('print-area');
    a.innerHTML = `
      <div style="text-align:center"><h1 style="font-family:sans-serif">${this.activeExam.title} - Hızlı Konu Özeti</h1><p>Geliştirici: Fatih PATIR</p></div><hr>
      <div style="font-size:14pt; line-height:1.6; padding:20px; font-family:sans-serif;">${this.activeExam.summary.replace(/<br><br>/g, '<br><br><br>')}</div>
    `;
    window.print();
  },

  printOpenEnded() {
    const a = document.getElementById('print-area');
    let html = `<div style="text-align:center"><h1 style="font-family:sans-serif">${this.activeExam.title} - Açık Uçlu Sınav Soruları</h1><p>Geliştirici: Fatih PATIR</p></div><hr>`;
    html += this.activeExam.openEnded.map((q, i) => `
      <div style="margin-bottom:25px; padding:15px; border-bottom:1px solid #eee; font-family:sans-serif;">
        <strong style="font-size:13pt;">Soru ${i+1}: ${q.q}</strong><br><br>
        <div style="font-size:12pt; color:#222;"><strong>Cevap:</strong> ${q.a}</div>
      </div>
    `).join('');
    a.innerHTML = html;
    window.print();
  },

  printNotes() {
    const a = document.getElementById('print-area');
    let html = `<div style="text-align:center"><h1 style="font-family:sans-serif">${this.activeExam.title} - Sosyal Medya Çalışma Notları</h1><p>Geliştirici: Fatih PATIR</p></div><hr>`;
    html += `<h2 style="margin-top:30px; font-family:sans-serif;">Açık Uçlu Sınav Soruları</h2>`;
    html += this.activeExam.openEnded.map(q => `<div style="margin-bottom:20px; padding:15px; border-bottom:1px solid #ddd; font-family:sans-serif;"><strong>🧠 ${q.q}</strong><br><br>💎 ${q.a}</div>`).join('');
    html += `<h2 style="margin-top:30px; font-family:sans-serif;">Diğer Çalışma Soruları</h2>`;
    html += this.activeExam.questions.map(q => `<div style="margin-bottom:20px; padding:15px; border-bottom:1px solid #ddd; font-family:sans-serif;"><strong>📽️ ${q.q}</strong><br><br>💎 ${q.a}</div>`).join('');
    a.innerHTML = html;
    window.print();
  },

  showToast(m) {
    const t = document.getElementById('achievement-toast');
    t.innerText = m; t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
  },

  triggerConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const parts = [];
    for(let i=0; i<150; i++) parts.push({ x: Math.random()*canvas.width, y: -20, r: Math.random()*5+2, d: Math.random()*canvas.width, color: `hsl(${Math.random()*360},80%,60%)` });
    function draw() {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      parts.forEach(p => { ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill(); p.y += 4; });
      if(parts.some(p => p.y < canvas.height)) requestAnimationFrame(draw);
    }
    draw();
  },

  toggleTheme() {
    this.playSound('click');
    document.body.style.filter = document.body.style.filter === 'sepia(1)' ? 'none' : 'sepia(1)';
  },

  search(val) {
    const cards = document.querySelectorAll('#exam-grid .card');
    cards.forEach(c => {
      const txt = c.innerText.toLowerCase();
      c.style.display = txt.includes(val.toLowerCase()) ? 'flex' : 'none';
    });
  }
};

window.onload = () => app.init();
