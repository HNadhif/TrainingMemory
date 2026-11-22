/**
 * ==============================================================================
 * NUMORIA - CORE GAME ENGINE (Revisi 3)
 * - Desktop: Aspect ratio lebar memanjang ke samping, tidak terlalu tebal vertikal.
 * - Dedicated Slider Control: Di samping canvas (Desktop) / Di bawah canvas (HP).
 * - Kecepatan slider 1:1 instan tanpa batas (gerak cepat = cepat, lambat = lambat).
 * - Wave berbentuk clean Line (oscilloscope line) dengan Head (START) & Tail (END).
 * - Performa ringan & dioptimalkan (tanpa shadowBlur berat, partikel efisien).
 * ==============================================================================
 */
class NumoriaGame {
  constructor() {
    this.sound = new SoundEngine();
    this.particles = new ParticleSystem();
    this.config = window.GAME_CONFIG;

    // Orientation State: 'portrait' (HP, vertical) or 'landscape' (Desktop, horizontal)
    this.orientation = 'portrait';
    this.manualOrientation = null;

    // Overall Game State
    this.state = 'INITIAL';
    this.currentRoundIdx = 0;
    this.currentWaveIdx = 0;

    // Statistics Variables
    this.totalWavesCount = this.config.TOTAL_WAVES; // 22 total waves
    this.totalWavesSuccess = 0;
    this.totalRoundsSuccess = 0;
    this.allRoundsHistory = [];

    // Current Round Tracking Variables
    this.currentRoundNumbers = [];
    this.currentRoundWavesTraced = 0;
    this.roundWaveAccuracies = [];

    // Active Wave Line (Clean finite line with start, body, end)
    this.currentWave = null;

    // Player Coordinates (constrained to 1 transverse axis on Judgment Line)
    this.playerX = 240;
    this.playerY = 480;
    this.judgmentLinePos = 480; // Y in portrait, X in landscape
    this.isCurrentlyInSync = false;
    this.toleranceRadius = this.config.TOLERANCE_RADIUS;

    // Controls
    this.keys = {};
    this.keySpeed = this.config.KEY_SPEED;
    this.isDraggingSlider = false;

    // Input Answer modal state
    this.userInputValue = "";

    // Canvas Setup
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.dpr = window.devicePixelRatio || 1;
    this.canvasWidth = 480;
    this.canvasHeight = 700;

    // Stars background (lightweight)
    this.stars = [];
    this.initStars();

    // Bind DOM & Events
    this.bindDOM();
    this.setupEventListeners();
    this.updateOrientationAndResize();

    // Initial Splash Screen Transition
    setTimeout(() => {
      this.switchScreen('screen-start');
      this.state = 'MENU';
    }, 1200);

    // Start Animation Loop
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  initStars() {
    this.stars = [];
    const count = this.isLandscape() ? 30 : 20; // Lightweight count
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * (this.canvasWidth || 800),
        y: Math.random() * (this.canvasHeight || 600),
        size: Math.random() * 1.5 + 0.6,
        speed: Math.random() * 70 + 25,
        alpha: Math.random() * 0.6 + 0.2
      });
    }
  }

  isLandscape() {
    return this.orientation === 'landscape';
  }

  updateOrientationAndResize() {
    if (this.manualOrientation) {
      this.orientation = this.manualOrientation;
    } else {
      const isWide = window.innerWidth > window.innerHeight && window.innerWidth >= 640;
      this.orientation = isWide ? 'landscape' : 'portrait';
    }

    const app = document.getElementById('app');
    const isLand = this.isLandscape();

    if (isLand) {
      app.classList.add('desktop-landscape');
      if (this.sliderContainer) {
        this.sliderContainer.classList.remove('slider-horizontal');
        this.sliderContainer.classList.add('slider-vertical');
      }
      if (this.controlHintElement) {
        this.controlHintElement.innerHTML = `<span>Kontrol:</span> <span>Slider di Samping (Mouse)</span> • <span><span class="kbd">W</span> / <span class="kbd">S</span></span>`;
      }
    } else {
      app.classList.remove('desktop-landscape');
      if (this.sliderContainer) {
        this.sliderContainer.classList.remove('slider-vertical');
        this.sliderContainer.classList.add('slider-horizontal');
      }
      if (this.controlHintElement) {
        this.controlHintElement.innerHTML = `<span>Kontrol:</span> <span>Slider di Bawah (Sentuh)</span> • <span><span class="kbd">A</span> / <span class="kbd">D</span></span>`;
      }
    }

    this.resizeCanvas();
  }

  resizeCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvasWidth = Math.round(rect.width) || (this.isLandscape() ? 900 : 480);
    this.canvasHeight = Math.round(rect.height) || (this.isLandscape() ? 440 : 540);

    this.canvas.width = this.canvasWidth * this.dpr;
    this.canvas.height = this.canvasHeight * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    // Judgment Line position (seimbang, tidak terlalu dekat dan tidak terlalu jauh):
    // Portrait: Garis horizontal proporsional (~84% tinggi canvas)
    // Landscape: Garis vertikal proporsional (~88% lebar canvas)
    if (this.isLandscape()) {
      this.judgmentLinePos = Math.round(this.canvasWidth * 0.88);
      this.playerX = this.judgmentLinePos;
      this.setSliderRatio(0.5); // Center slider
    } else {
      this.judgmentLinePos = Math.round(this.canvasHeight * 0.84);
      this.playerY = this.judgmentLinePos;
      this.setSliderRatio(0.5); // Center slider
    }
  }

  bindDOM() {
    // Screens
    this.screens = {
      loader: document.getElementById('screen-loader'),
      start: document.getElementById('screen-start'),
      game: document.getElementById('screen-game'),
      results: document.getElementById('screen-results')
    };

    // Dedicated Visual Slider Elements
    this.sliderContainer = document.getElementById('slider-container');
    this.sliderTrack = document.getElementById('slider-track');
    this.sliderThumb = document.getElementById('slider-thumb');

    // Modals & Overlays
    this.modalAnswer = document.getElementById('modal-answer');
    this.modalFeedback = document.getElementById('modal-feedback');
    this.countdownOverlay = document.getElementById('countdown-overlay');
    this.popupNumberOverlay = document.getElementById('popup-number-overlay');
    this.waveToast = document.getElementById('wave-toast');

    // Buttons
    this.btnStartGame = document.getElementById('btn-start-game');
    this.btnSoundToggle = document.getElementById('btn-sound-toggle');
    this.btnSubmitAnswer = document.getElementById('btn-submit-answer');
    this.btnFeedbackNext = document.getElementById('btn-feedback-next');
    this.btnPlayAgain = document.getElementById('btn-play-again');
    this.btnShareScore = document.getElementById('btn-share-score');
    this.controlHintElement = document.getElementById('control-hint-desc');

    // HUD Elements
    this.hudRoundText = document.getElementById('hud-round-text');
    this.hudWaveText = document.getElementById('hud-wave-text');
    this.syncPctText = document.getElementById('sync-pct-text');
    this.syncStatusIndicator = document.getElementById('sync-status-indicator');
    this.syncProgressBar = document.getElementById('sync-progress-bar');
    this.waveDotsContainer = document.getElementById('wave-dots');

    // Overlay Elements
    this.countdownNumber = document.getElementById('countdown-number');
    this.countdownRoundTag = document.getElementById('countdown-round-tag');
    this.popupNumberVal = document.getElementById('popup-number-value');
    this.popupTimerFill = document.getElementById('popup-timer-fill');

    // Answer Modal Elements
    this.inputDisplayVal = document.getElementById('input-display-val');
    this.answerModalTitle = document.getElementById('answer-modal-title');

    // Feedback Modal Elements
    this.feedbackIcon = document.getElementById('feedback-icon');
    this.feedbackTitle = document.getElementById('feedback-title');
    this.feedbackDesc = document.getElementById('feedback-desc');
    this.fbUserAns = document.getElementById('fb-user-ans');
    this.fbCorrectAns = document.getElementById('fb-correct-ans');
    this.fbWaveTraced = document.getElementById('fb-wave-traced');
    this.fbFormula = document.getElementById('fb-formula');

    // Results Screen Elements
    this.resTotalScore = document.getElementById('res-total-score');
    this.resGradePill = document.getElementById('res-grade-pill');
    this.resWavePts = document.getElementById('res-wave-pts');
    this.resWaveBar = document.getElementById('res-wave-bar');
    this.resWaveRatio = document.getElementById('res-wave-ratio');
    this.resWaveAcc = document.getElementById('res-wave-acc');
    this.resMathPts = document.getElementById('res-math-pts');
    this.resMathBar = document.getElementById('res-math-bar');
    this.resMathRatio = document.getElementById('res-math-ratio');
    this.resMathPct = document.getElementById('res-math-pct');
  }

  /* Direct, unrestricted 1:1 Slider Positioning */
  setSliderRatio(ratio) {
    const clamped = Math.max(0, Math.min(1, ratio));

    if (this.isLandscape()) {
      // Desktop: Vertical Slider (Up <-> Down)
      // Playable track height with 25px safe margin
      const margin = 28;
      this.playerX = this.judgmentLinePos;
      this.playerY = margin + clamped * (this.canvasHeight - margin * 2);

      if (this.sliderThumb) {
        this.sliderThumb.style.top = (clamped * 100) + '%';
        this.sliderThumb.style.left = '50%';
      }
    } else {
      // HP: Horizontal Slider (Left <-> Right)
      // Playable track width with 20px safe margin
      const margin = 24;
      this.playerY = this.judgmentLinePos;
      this.playerX = margin + clamped * (this.canvasWidth - margin * 2);

      if (this.sliderThumb) {
        this.sliderThumb.style.left = (clamped * 100) + '%';
        this.sliderThumb.style.top = '50%';
      }
    }
  }

  setupEventListeners() {
    window.addEventListener('resize', () => {
      this.updateOrientationAndResize();
    });

    // Sound Toggle
    this.btnSoundToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const unmuted = this.sound.toggleMute();
      const soundSvgOn = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`;
      const soundSvgOff = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`;
      this.btnSoundToggle.innerHTML = unmuted ? soundSvgOn : soundSvgOff;
    });

    // Start Game
    this.btnStartGame.addEventListener('click', () => {
      this.sound.init();
      this.startEntireGame();
    });

    // Submit Answer Button
    this.btnSubmitAnswer.addEventListener('click', () => {
      this.processRoundAnswer();
    });

    // Feedback Next Button
    this.btnFeedbackNext.addEventListener('click', () => {
      this.closeFeedbackAndProceed();
    });

    // Play Again Button
    this.btnPlayAgain.addEventListener('click', () => {
      this.startEntireGame();
    });

    // Share Score Button
    this.btnShareScore.addEventListener('click', () => {
      this.copyScoreToClipboard();
    });

    // Virtual Numpad Keys
    document.querySelectorAll('.num-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-key');
        this.handleNumpadInput(key);
      });
    });

    // ========================================================================
    // SLIDER EVENT LISTENERS: DIRECT 1:1 INSTANT MAPPING (NO SPEED LIMIT)
    // ========================================================================
    const updateFromPointer = (clientX, clientY) => {
      if (!this.sliderTrack) return;
      const rect = this.sliderTrack.getBoundingClientRect();

      if (this.isLandscape()) {
        const relY = (clientY - rect.top) / rect.height;
        this.setSliderRatio(relY);
      } else {
        const relX = (clientX - rect.left) / rect.width;
        this.setSliderRatio(relX);
      }
    };

    // Slider Track Pointer Events (Primary Dedicated Slider)
    const onPointerDown = (e) => {
      if (this.state === 'WAVE_ACTIVE') {
        this.isDraggingSlider = true;
        updateFromPointer(e.clientX, e.clientY);
      }
    };

    const onPointerMove = (e) => {
      if (this.state === 'WAVE_ACTIVE' && (this.isDraggingSlider || e.buttons > 0)) {
        updateFromPointer(e.clientX, e.clientY);
      }
    };

    const onPointerUp = () => {
      this.isDraggingSlider = false;
    };

    if (this.sliderContainer) {
      this.sliderContainer.addEventListener('pointerdown', onPointerDown);
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
    }

    // Canvas also accepts direct pointer dragging for maximum comfort
    this.canvas.addEventListener('pointerdown', (e) => {
      if (this.state === 'WAVE_ACTIVE') {
        this.isDraggingSlider = true;
        const rect = this.canvas.getBoundingClientRect();
        if (this.isLandscape()) {
          this.setSliderRatio((e.clientY - rect.top) / rect.height);
        } else {
          this.setSliderRatio((e.clientX - rect.left) / rect.width);
        }
      }
    });

    this.canvas.addEventListener('pointermove', (e) => {
      if (this.state === 'WAVE_ACTIVE' && (this.isDraggingSlider || e.buttons > 0)) {
        const rect = this.canvas.getBoundingClientRect();
        if (this.isLandscape()) {
          this.setSliderRatio((e.clientY - rect.top) / rect.height);
        } else {
          this.setSliderRatio((e.clientX - rect.left) / rect.width);
        }
      }
    });

    // Physical Keyboard Support
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;

      if (this.modalAnswer.classList.contains('active')) {
        if (e.key >= '0' && e.key <= '9') {
          this.handleNumpadInput(e.key);
        } else if (e.key === '-' || e.key === '_') {
          this.handleNumpadInput('sign');
        } else if (e.key === 'Backspace') {
          this.handleNumpadInput('del');
        } else if (e.key === 'Enter') {
          this.processRoundAnswer();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
  }

  toggleOrientationMode() {
    this.manualOrientation = this.isLandscape() ? 'portrait' : 'landscape';
    this.updateOrientationAndResize();
    this.initStars();
  }

  switchScreen(screenId) {
    Object.values(this.screens).forEach(s => s.classList.remove('active'));
    if (this.screens[screenId.replace('screen-', '')]) {
      this.screens[screenId.replace('screen-', '')].classList.add('active');
    }
  }

  /* ========================================================================
     ORGANIC WAVE LINE GENERATOR
     - Muncul perlahan dari offscreen (spawn dari luar layar)
     - Kurva halus, tidak terlalu menekuk
     - Pola lekukan acak (random spline waypoints)
     ======================================================================== */
  createWaveLine(config) {
    const isLand = this.isLandscape();
    const duration = config.waveDuration;
    const speed = config.speed;
    const length = duration * speed;

    // Muncul dari luar layar (offscreen) secara bertahap
    const leadInDist = this.judgmentLinePos + 40;

    const transverseDimension = isLand ? this.canvasHeight : this.canvasWidth;
    const transverseCenter = transverseDimension / 2;

    // Amplitudo lembut: tidak terlalu menekuk (maksimal ±20% dimensi canvas)
    const maxAmp = transverseDimension * 0.20;

    // Bangun waypoint acak sepanjang gelombang (s)
    const waypoints = [];
    let currentS = -120;
    let lastY = transverseCenter + (Math.random() - 0.5) * maxAmp * 0.5;

    waypoints.push({ s: currentS, y: lastY });

    while (currentS < length + 300) {
      // Jarak lekukan acak: 190px s/d 310px agar variasi belokan dinamis
      const interval = 190 + Math.random() * 120;
      currentS += interval;

      // Batasi sudut kemiringan agar tidak menekuk ekstrem (maks slope ~0.32)
      const maxStep = Math.min(maxAmp * 1.05, interval * 0.32);
      const targetY = transverseCenter + (Math.random() - 0.5) * 2 * maxAmp;
      const delta = Math.max(-maxStep, Math.min(maxStep, targetY - lastY));
      lastY = Math.max(transverseCenter - maxAmp, Math.min(transverseCenter + maxAmp, lastY + delta));

      waypoints.push({ s: currentS, y: lastY });
    }

    // Evaluasi kurva halus menggunakan Catmull-Rom Spline
    const getTransverseAt = (s) => {
      let i = 0;
      while (i < waypoints.length - 2 && waypoints[i + 1].s < s) {
        i++;
      }

      const p0 = (i > 0) ? waypoints[i - 1] : waypoints[i];
      const p1 = waypoints[i];
      const p2 = (i + 1 < waypoints.length) ? waypoints[i + 1] : p1;
      const p3 = (i + 2 < waypoints.length) ? waypoints[i + 2] : p2;

      const span = Math.max(1, p2.s - p1.s);
      const t = Math.max(0, Math.min(1, (s - p1.s) / span));

      const t2 = t * t;
      const t3 = t2 * t;

      const v0 = (p2.y - p0.y) * 0.5;
      const v1 = (p3.y - p1.y) * 0.5;

      const h00 = 2 * t3 - 3 * t2 + 1;
      const h10 = t3 - 2 * t2 + t;
      const h01 = -2 * t3 + 3 * t2;
      const h11 = t3 - t2;

      return h00 * p1.y + h10 * v0 + h01 * p2.y + h11 * v1;
    };

    return {
      duration: duration,
      speed: speed,
      length: length,
      leadInDist: leadInDist,
      totalDist: length + leadInDist,
      travelDist: 0,
      getTransverseAt: getTransverseAt,
      timeInSync: 0,
      activeHoldTime: 0,
      hasHeadHit: false,
      hasTailHit: false
    };
  }

  /* ========================================================================
     GAMEPLAY FLOW CONTROLLER
     ======================================================================== */
  startEntireGame() {
    this.currentRoundIdx = 0;
    this.totalWavesSuccess = 0;
    this.totalRoundsSuccess = 0;
    this.allRoundsHistory = [];

    this.switchScreen('screen-game');
    this.updateOrientationAndResize();
    this.startRound(0);
  }

  startRound(roundIndex) {
    this.currentRoundIdx = roundIndex;
    this.currentWaveIdx = 0;
    this.currentRoundNumbers = [];
    this.currentRoundWavesTraced = 0;
    this.roundWaveAccuracies = [];

    const config = this.config.ROUNDS[this.currentRoundIdx];

    this.hudRoundText.textContent = `${config.roundNum}/4`;
    this.hudWaveText.textContent = `1/${config.wavesCount}`;
    this.renderWaveDots(config.wavesCount);

    this.setSliderRatio(0.5);

    this.runCountdown(() => {
      this.startWave(0);
    });
  }

  renderWaveDots(totalWaves) {
    this.waveDotsContainer.innerHTML = '';
    for (let i = 0; i < totalWaves; i++) {
      const dot = document.createElement('div');
      dot.className = 'wave-dot' + (i === 0 ? ' active' : '');
      dot.id = `wave-dot-${i}`;
      this.waveDotsContainer.appendChild(dot);
    }
  }

  updateWaveDotStatus(waveIdx, isSuccess) {
    const dot = document.getElementById(`wave-dot-${waveIdx}`);
    if (dot) {
      dot.classList.remove('active');
      dot.classList.add(isSuccess ? 'success' : 'failed');
    }
  }

  runCountdown(callback) {
    this.state = 'COUNTDOWN';
    this.countdownOverlay.classList.add('active');
    this.countdownRoundTag.textContent = `RONDE ${this.currentRoundIdx + 1} DARI 4`;

    let count = 3;
    this.countdownNumber.textContent = count;
    this.sound.playCountdownBeep(false);

    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        this.countdownNumber.textContent = count;
        this.countdownNumber.style.animation = 'none';
        void this.countdownNumber.offsetWidth;
        this.countdownNumber.style.animation = 'countPulse 0.9s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards';
        this.sound.playCountdownBeep(false);
      } else if (count === 0) {
        this.countdownNumber.textContent = 'MULAI!';
        this.sound.playCountdownBeep(true);
      } else {
        clearInterval(interval);
        this.countdownOverlay.classList.remove('active');
        if (callback) callback();
      }
    }, 900);
  }

  /* ========================================================================
     WAVE LINE LIFECYCLE (START -> BODY LINE TRACE -> END)
     ======================================================================== */
  startWave(waveIndex) {
    this.state = 'WAVE_ACTIVE';
    this.currentWaveIdx = waveIndex;
    const config = this.config.ROUNDS[this.currentRoundIdx];

    this.hudWaveText.textContent = `${this.currentWaveIdx + 1}/${config.wavesCount}`;
    const activeDot = document.getElementById(`wave-dot-${this.currentWaveIdx}`);
    if (activeDot) activeDot.classList.add('active');

    // Create the clean finite wave line
    this.currentWave = this.createWaveLine(config);

    this.syncProgressBar.style.width = '0%';
    this.syncPctText.textContent = '0%';
    if (this.syncStatusIndicator) {
      this.syncStatusIndicator.textContent = '';
    }
  }

  endWave() {
    if (!this.currentWave) return;
    const w = this.currentWave;
    const accuracy = Math.min(1.0, w.timeInSync / w.duration);
    const isSuccess = accuracy >= this.config.SYNC_THRESHOLD;

    this.roundWaveAccuracies.push(accuracy);
    if (isSuccess) {
      this.currentRoundWavesTraced++;
      this.totalWavesSuccess++;
      this.sound.playWaveSuccess();
      this.showWaveToast(true, `Wave ${this.currentWaveIdx + 1} Berhasil! (${Math.round(accuracy * 100)}%)`);
    } else {
      this.sound.playWaveMiss();
      this.showWaveToast(false, `Wave ${this.currentWaveIdx + 1} Gagal (${Math.round(accuracy * 100)}%)`);
    }

    this.updateWaveDotStatus(this.currentWaveIdx, isSuccess);
    this.currentWave = null;

    // Trigger Number Pop-up between waves
    this.triggerNumberPopup();
  }

  showWaveToast(isSuccess, text) {
    this.waveToast.textContent = text;
    this.waveToast.className = isSuccess ? 'toast-success active' : 'toast-fail active';
    setTimeout(() => {
      this.waveToast.classList.remove('active');
    }, 1200);
  }

  triggerNumberPopup() {
    this.state = 'NUMBER_POPUP';
    const num = this.config.generateRandomNumber();
    this.currentRoundNumbers.push(num);

    const isPositive = num > 0;
    const displayStr = isPositive ? `+${num}` : `${num}`;
    this.popupNumberVal.textContent = displayStr;
    this.popupNumberVal.className = `popup-value ${isPositive ? 'positive' : 'negative'}`;

    this.popupTimerFill.style.transition = 'none';
    this.popupTimerFill.style.transform = 'scaleX(1)';
    this.popupNumberOverlay.classList.add('active');
    this.sound.playNumberPopup();

    setTimeout(() => {
      this.popupTimerFill.style.transition = 'transform 0.95s linear';
      this.popupTimerFill.style.transform = 'scaleX(0)';
    }, 20);

    setTimeout(() => {
      this.popupNumberOverlay.classList.remove('active');
      const config = this.config.ROUNDS[this.currentRoundIdx];
      
      if (this.currentWaveIdx + 1 < config.wavesCount) {
        this.startWave(this.currentWaveIdx + 1);
      } else {
        this.openRoundAnswerModal();
      }
    }, this.config.POPUP_DURATION_MS);
  }

  /* ========================================================================
     ROUND ANSWER INPUT & FEEDBACK
     ======================================================================== */
  openRoundAnswerModal() {
    this.state = 'ANSWER_INPUT';
    this.userInputValue = "";
    this.inputDisplayVal.textContent = "0";
    this.inputDisplayVal.classList.add('placeholder');
    this.answerModalTitle.textContent = `Ronde ${this.currentRoundIdx + 1} Selesai!`;
    this.modalAnswer.classList.add('active');
  }

  handleNumpadInput(key) {
    if (key === 'del') {
      if (this.userInputValue.length > 0) {
        this.userInputValue = this.userInputValue.slice(0, -1);
        if (this.userInputValue === '-' || this.userInputValue === '') {
          this.userInputValue = '';
        }
      }
    } else if (key === 'sign') {
      if (this.userInputValue.startsWith('-')) {
        this.userInputValue = this.userInputValue.slice(1);
      } else {
        this.userInputValue = '-' + this.userInputValue;
      }
    } else {
      if (this.userInputValue.length < 5) {
        if (this.userInputValue === '0') {
          this.userInputValue = key;
        } else if (this.userInputValue === '-0') {
          this.userInputValue = '-' + key;
        } else {
          this.userInputValue += key;
        }
      }
    }

    if (this.userInputValue === '' || this.userInputValue === '-') {
      this.inputDisplayVal.textContent = this.userInputValue === '-' ? '-' : '0';
      this.inputDisplayVal.classList.add('placeholder');
    } else {
      this.inputDisplayVal.textContent = this.userInputValue;
      this.inputDisplayVal.classList.remove('placeholder');
    }
  }

  processRoundAnswer() {
    if (this.state !== 'ANSWER_INPUT') return;
    const userAns = parseInt(this.userInputValue, 10) || 0;
    const actualSum = this.currentRoundNumbers.reduce((a, b) => a + b, 0);
    const isCorrect = (userAns === actualSum);

    if (isCorrect) {
      this.totalRoundsSuccess++;
      this.sound.playSuccessChime();
    } else {
      this.sound.playWrongBuzz();
    }

    this.modalAnswer.classList.remove('active');
    this.showAnswerFeedback(isCorrect, userAns, actualSum);
  }

  showAnswerFeedback(isCorrect, userAns, actualSum) {
    this.state = 'FEEDBACK';
    this.modalFeedback.className = `modal-backdrop active ${isCorrect ? 'feedback-correct' : 'feedback-wrong'}`;

    this.feedbackIcon.textContent = isCorrect ? 'OK' : 'ERR';
    this.feedbackTitle.textContent = isCorrect ? 'JAWABAN BENAR' : 'KURANG TEPAT';
    this.feedbackDesc.textContent = isCorrect 
      ? 'Memori kerja & aritmatika mental Anda sangat akurat.' 
      : 'Fokus ganda terbagi. Perhatikan kunci penjumlahan di bawah.';

    this.fbUserAns.textContent = (userAns >= 0 ? `+${userAns}` : `${userAns}`);
    this.fbCorrectAns.textContent = (actualSum >= 0 ? `+${actualSum}` : `${actualSum}`);
    
    const config = this.config.ROUNDS[this.currentRoundIdx];
    this.fbWaveTraced.textContent = `${this.currentRoundWavesTraced} / ${config.wavesCount} Gelombang`;

    const stepsStr = this.currentRoundNumbers.map(n => n >= 0 ? `(+${n})` : `(${n})`).join(' + ');
    this.fbFormula.innerHTML = `<strong>Rincian Angka:</strong> ${stepsStr} = <strong>${actualSum >= 0 ? `+${actualSum}` : actualSum}</strong>`;

    this.allRoundsHistory.push({
      round: this.currentRoundIdx + 1,
      isMathCorrect: isCorrect,
      userAns: userAns,
      actualSum: actualSum,
      wavesTraced: this.currentRoundWavesTraced,
      wavesTotal: config.wavesCount
    });
  }

  closeFeedbackAndProceed() {
    this.modalFeedback.classList.remove('active');
    if (this.currentRoundIdx + 1 < this.config.ROUNDS.length) {
      this.startRound(this.currentRoundIdx + 1);
    } else {
      this.showFinalResults();
    }
  }

  /* ========================================================================
     FINAL SCORING & COGNITIVE DASHBOARD
     ======================================================================== */
  showFinalResults() {
    this.state = 'RESULTS';
    this.switchScreen('screen-results');

    const waveRatio = (this.totalWavesSuccess / this.totalWavesCount);
    const waveScore = Math.round(waveRatio * this.config.MAX_WAVE_SCORE);

    const mathRatio = (this.totalRoundsSuccess / this.config.TOTAL_ROUNDS);
    const mathScore = Math.round(mathRatio * this.config.MAX_MATH_SCORE);

    const totalScore = waveScore + mathScore;

    this.animateScoreCounter(totalScore);

    this.resWavePts.textContent = `${waveScore.toLocaleString()} PTS`;
    this.resWaveRatio.textContent = `${this.totalWavesSuccess} / ${this.totalWavesCount} Gelombang Berhasil`;
    this.resWaveAcc.textContent = `Akurasi: ${Math.round(waveRatio * 100)}%`;
    this.resWaveBar.style.width = `${Math.round(waveRatio * 100)}%`;

    this.resMathPts.textContent = `${mathScore.toLocaleString()} PTS`;
    this.resMathRatio.textContent = `${this.totalRoundsSuccess} / ${this.config.TOTAL_ROUNDS} Ronde Benar`;
    this.resMathPct.textContent = `Ketepatan: ${Math.round(mathRatio * 100)}%`;
    this.resMathBar.style.width = `${Math.round(mathRatio * 100)}%`;

    let gradeText = "";
    if (totalScore >= 9000) {
      gradeText = "GRADE S";
      this.resGradePill.style.color = "var(--accent-green)";
    } else if (totalScore >= 7500) {
      gradeText = "GRADE A";
      this.resGradePill.style.color = "var(--secondary-cyan)";
    } else if (totalScore >= 5500) {
      gradeText = "GRADE B";
      this.resGradePill.style.color = "var(--accent-amber)";
    } else {
      gradeText = "GRADE C ";
      this.resGradePill.style.color = "var(--accent-red)";
    }
    this.resGradePill.textContent = gradeText;
  }

  animateScoreCounter(targetScore) {
    let current = 0;
    const step = Math.ceil(targetScore / 40);
    const timer = setInterval(() => {
      current += step;
      if (current >= targetScore) {
        current = targetScore;
        clearInterval(timer);
      }
      this.resTotalScore.textContent = current.toLocaleString();
    }, 25);
  }

  copyScoreToClipboard() {
    const text = `NUMORIA - Dual-Task Cognitive Game\n` +
      `Total Skor: ${this.resTotalScore.textContent} PTS\n` +
      `Wave Tracking: ${this.totalWavesSuccess}/${this.totalWavesCount} Gelombang Berhasil\n` +
      `Mental Math: ${this.totalRoundsSuccess}/${this.config.TOTAL_ROUNDS} Ronde Tepat\n` +
      `Hasil evaluasi performa fokus ganda visuomotor & working memory di Numoria.`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        alert('Hasil skor berhasil disalin ke clipboard!');
      }).catch(() => {
        alert(text);
      });
    } else {
      alert(text);
    }
  }

  /* ========================================================================
     PHYSICS & CANVAS RENDERING LOOP (LIGHTWEIGHT & HIGH PERFORMANCE)
     ======================================================================== */
  update(dt) {
    const isLand = this.isLandscape();

    // 1. Lightweight star drift
    for (const star of this.stars) {
      if (isLand) {
        star.x += star.speed * dt;
        if (star.x > this.canvasWidth) {
          star.x = 0;
          star.y = Math.random() * this.canvasHeight;
        }
      } else {
        star.y += star.speed * dt;
        if (star.y > this.canvasHeight) {
          star.y = 0;
          star.x = Math.random() * this.canvasWidth;
        }
      }
    }

    // 2. Keyboard Control (updates slider position smoothly)
    if (this.state === 'WAVE_ACTIVE') {
      const moveDist = this.keySpeed * dt;

      if (isLand) {
        const margin = 28;
        const trackH = this.canvasHeight - margin * 2;
        let curY = this.playerY;

        if (this.keys['w'] || this.keys['arrowup']) {
          curY = Math.max(margin, curY - moveDist);
        }
        if (this.keys['s'] || this.keys['arrowdown']) {
          curY = Math.min(this.canvasHeight - margin, curY + moveDist);
        }
        if (curY !== this.playerY) {
          this.setSliderRatio((curY - margin) / trackH);
        }
      } else {
        const margin = 24;
        const trackW = this.canvasWidth - margin * 2;
        let curX = this.playerX;

        if (this.keys['a'] || this.keys['arrowleft']) {
          curX = Math.max(margin, curX - moveDist);
        }
        if (this.keys['d'] || this.keys['arrowright']) {
          curX = Math.min(this.canvasWidth - margin, curX + moveDist);
        }
        if (curX !== this.playerX) {
          this.setSliderRatio((curX - margin) / trackW);
        }
      }

      // 3. Wave Line Progress & Line Alignment Check
      if (this.currentWave) {
        const w = this.currentWave;
        w.travelDist += w.speed * dt;

        if (!w.hasHeadHit && w.travelDist >= w.leadInDist) {
          w.hasHeadHit = true;
          this.sound.playWaveHeadHit();
        }

        const isHeadCrossed = w.travelDist >= w.leadInDist;
        const isTailCrossed = w.travelDist >= w.totalDist;

        if (isHeadCrossed && !isTailCrossed) {
          w.activeHoldTime += dt;

          const s = w.travelDist - w.leadInDist;
          const linePos = w.getTransverseAt(s);

          let deviation = 0;
          if (isLand) {
            deviation = Math.abs(this.playerY - linePos);
          } else {
            deviation = Math.abs(this.playerX - linePos);
          }

          this.isCurrentlyInSync = (deviation <= this.toleranceRadius);

          if (this.isCurrentlyInSync) {
            w.timeInSync += dt;
            this.particles.emit(this.playerX, this.playerY, '#22d3ee', 1, 2.0);
          }

          const currentAcc = Math.min(1.0, w.timeInSync / w.activeHoldTime);
          const currentPct = Math.round(currentAcc * 100);
          this.syncPctText.textContent = `${currentPct}%`;
          this.syncProgressBar.style.width = `${Math.min(100, Math.round((w.timeInSync / (w.duration * this.config.SYNC_THRESHOLD)) * 100))}%`;
        }

        if (isTailCrossed) {
          w.hasTailHit = true;
          this.sound.playWaveTailRelease();
          this.endWave();
        }
      }
    }

    this.particles.update(dt);
  }

  draw() {
    const ctx = this.ctx;
    const isLand = this.isLandscape();
    ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    // 1. Draw Starfield (simple dots without shadowBlur)
    ctx.fillStyle = '#ffffff';
    for (const star of this.stars) {
      ctx.globalAlpha = star.alpha;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }
    ctx.globalAlpha = 1.0;

    // 2. Subtle Flow Grid Lines
    ctx.strokeStyle = 'rgba(124, 58, 237, 0.07)';
    ctx.lineWidth = 1;
    if (isLand) {
      const gridOffset = (performance.now() * 0.15) % 40;
      for (let x = gridOffset; x < this.canvasWidth; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, this.canvasHeight);
        ctx.stroke();
      }
    } else {
      const gridOffset = (performance.now() * 0.15) % 40;
      for (let y = gridOffset; y < this.canvasHeight; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(this.canvasWidth, y);
        ctx.stroke();
      }
    }

    // 3. Render Clean Wave Line (Replacing the old heavy ribbon)
    if (this.currentWave) {
      this.drawWaveLine(ctx, this.currentWave, isLand);
    }

    // 4. Render Judgment Line
    this.drawJudgmentLine(ctx, isLand);

    // 5. Render Player Slider Puck & Visual Tether on Canvas
    this.drawPlayerPuck(ctx, isLand);

    // 6. Draw Particles (lightweight)
    this.particles.draw(ctx);
  }

  /* Render Clean Wave Line with Head & Tail Nodes (Zero shadowBlur overhead) */
  drawWaveLine(ctx, w, isLand) {
    const step = 6;
    const linePts = [];

    for (let s = 0; s <= w.length; s += step) {
      const transverse = w.getTransverseAt(s);
      const flowPos = this.judgmentLinePos - (s - (w.travelDist - w.leadInDist));

      if (isLand) {
        if (flowPos >= -50 && flowPos <= this.canvasWidth + 50) {
          linePts.push({ x: flowPos, y: transverse });
        }
      } else {
        if (flowPos >= -50 && flowPos <= this.canvasHeight + 50) {
          linePts.push({ x: transverse, y: flowPos });
        }
      }
    }

    if (linePts.length < 2) return;

    // Clean wave line (pure path without start/end circles)
    const lw = this.config.LINE_WIDTH || 8;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(linePts[0].x, linePts[0].y);
    for (let i = 1; i < linePts.length; i++) {
      ctx.lineTo(linePts[i].x, linePts[i].y);
    }
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Soft outer glow without shadowBlur performance penalty
    ctx.lineWidth = lw + 4;
    ctx.strokeStyle = 'rgba(2, 132, 199, 0.25)';
    ctx.stroke();

    // Solid main line
    ctx.lineWidth = lw;
    ctx.strokeStyle = '#38bdf8';
    ctx.stroke();
    ctx.restore();
  }

  /* Render the Judgment Target Line (Dekat slider, tanpa tulisan TARGET) */
  drawJudgmentLine(ctx, isLand) {
    ctx.save();
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 6]);

    if (isLand) {
      ctx.strokeStyle = this.isCurrentlyInSync ? 'rgba(52, 211, 153, 0.6)' : 'rgba(255, 255, 255, 0.25)';
      ctx.beginPath();
      ctx.moveTo(this.judgmentLinePos, 10);
      ctx.lineTo(this.judgmentLinePos, this.canvasHeight - 10);
      ctx.stroke();
    } else {
      ctx.strokeStyle = this.isCurrentlyInSync ? 'rgba(52, 211, 153, 0.6)' : 'rgba(255, 255, 255, 0.25)';
      ctx.beginPath();
      ctx.moveTo(10, this.judgmentLinePos);
      ctx.lineTo(this.canvasWidth - 10, this.judgmentLinePos);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* Render Player Puck on Canvas (Synchronized with the Dedicated Slider) */
  drawPlayerPuck(ctx, isLand) {
    ctx.save();
    ctx.translate(this.playerX, this.playerY);

    // Active wave target crosshair indicator
    if (this.currentWave && this.currentWave.hasHeadHit && !this.currentWave.hasTailHit) {
      const s = this.currentWave.travelDist - this.currentWave.leadInDist;
      const targetTransverse = this.currentWave.getTransverseAt(s);

      // Connecting tether
      ctx.beginPath();
      if (isLand) {
        ctx.moveTo(0, 0);
        ctx.lineTo(0, targetTransverse - this.playerY);
      } else {
        ctx.moveTo(0, 0);
        ctx.lineTo(targetTransverse - this.playerX, 0);
      }
      ctx.strokeStyle = this.isCurrentlyInSync ? 'rgba(34, 211, 238, 0.85)' : 'rgba(244, 63, 94, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Outer Halo
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fillStyle = this.isCurrentlyInSync ? 'rgba(6, 182, 212, 0.35)' : 'rgba(244, 63, 94, 0.25)';
    ctx.fill();

    // Puck Body
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Center Dot
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fillStyle = this.isCurrentlyInSync ? '#06b6d4' : '#ef4444';
    ctx.fill();

    ctx.restore();
  }

  gameLoop(timestamp) {
    const dt = Math.min(0.1, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;

    this.update(dt);
    this.draw();

    requestAnimationFrame((t) => this.gameLoop(t));
  }
}

window.NumoriaGame = NumoriaGame;
