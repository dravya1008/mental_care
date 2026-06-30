/**
 * SereneMind - Zen Zone Games & Audio Synthesizer
 * Implements Breathing Bubble, Web Audio procedural sound mixer, and Zen Canvas sound ripples.
 */

document.addEventListener("DOMContentLoaded", () => {
  // Navigation inside Zen Zone
  const gameTabs = document.querySelectorAll(".games-tab-btn");
  const gameViews = document.querySelectorAll(".game-view");

  gameTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const targetGame = tab.getAttribute("data-game");
      
      gameTabs.forEach(t => t.classList.remove("active"));
      gameViews.forEach(v => v.classList.remove("active"));

      tab.classList.add("active");
      const targetView = document.getElementById(`game-${targetGame}`);
      if (targetView) targetView.classList.add("active");

      // Trigger resize for canvas if active
      if (targetGame === "canvas-game") {
        resizeCanvas();
      }
    });
  });

  // ==========================================
  // GAME 1: BREATHING SANCTUARY
  // ==========================================
  const breathBubble = document.getElementById("breath-bubble");
  const breathInstruction = document.getElementById("breath-instruction");
  const breathTimer = document.getElementById("breath-timer");
  const breathStartBtn = document.getElementById("breath-start-btn");
  const breathStopBtn = document.getElementById("breath-stop-btn");
  const breathPatternSelect = document.getElementById("breath-pattern");

  let breathingActive = false;
  let breathIntervalId = null;
  let breathSessionSeconds = 0;
  let breathSessionInterval = null;

  // Breathing pattern configurations (times in seconds)
  const BREATH_PATTERNS = {
    box: [
      { action: "Inhale", duration: 4, scale: 2.2, opacity: 0.9, blur: 0 },
      { action: "Hold", duration: 4, scale: 2.2, opacity: 0.9, blur: 2 },
      { action: "Exhale", duration: 4, scale: 1.0, opacity: 0.5, blur: 0 },
      { action: "Hold", duration: 4, scale: 1.0, opacity: 0.4, blur: 0 }
    ],
    relax: [ // 4-7-8 pattern
      { action: "Inhale", duration: 4, scale: 2.2, opacity: 0.9, blur: 0 },
      { action: "Hold", duration: 7, scale: 2.2, opacity: 0.9, blur: 2 },
      { action: "Exhale", duration: 8, scale: 1.0, opacity: 0.5, blur: 0 }
    ],
    equal: [ // 5-5 pattern
      { action: "Inhale", duration: 5, scale: 2.2, opacity: 0.9, blur: 0 },
      { action: "Exhale", duration: 5, scale: 1.0, opacity: 0.5, blur: 0 }
    ]
  };

  function startBreathing() {
    breathingActive = true;
    breathStartBtn.classList.add("hidden");
    breathStopBtn.classList.remove("hidden");
    breathPatternSelect.disabled = true;
    
    breathSessionSeconds = 0;
    updateBreathTimerDisplay();
    
    // Start session timer
    breathSessionInterval = setInterval(() => {
      breathSessionSeconds++;
      updateBreathTimerDisplay();
      
      // Award Zen points for staying in the session
      if (breathSessionSeconds % 30 === 0) {
        window.SereneApp.addPoints(10);
      }
      
      // Mark checklist as completed after 3 mins (180s)
      if (breathSessionSeconds >= 180) {
        window.SereneApp.completeChecklistItem("game");
      }
    }, 1000);

    runBreathingCycle();
  }

  function stopBreathing() {
    breathingActive = false;
    clearInterval(breathSessionInterval);
    clearTimeout(breathIntervalId);
    
    breathStartBtn.classList.remove("hidden");
    breathStopBtn.classList.add("hidden");
    breathPatternSelect.disabled = false;

    // Reset bubble size
    if (breathBubble) {
      breathBubble.style.transform = "scale(1)";
      breathBubble.style.opacity = "0.7";
      breathBubble.style.filter = "blur(1px)";
    }
    if (breathInstruction) {
      breathInstruction.textContent = "Session Stopped";
    }
  }

  function updateBreathTimerDisplay() {
    const mins = Math.floor(breathSessionSeconds / 60).toString().padStart(2, "0");
    const secs = (breathSessionSeconds % 60).toString().padStart(2, "0");
    if (breathTimer) breathTimer.textContent = `${mins}:${secs}`;
  }

  function runBreathingCycle() {
    if (!breathingActive) return;

    const patternKey = breathPatternSelect.value;
    const steps = BREATH_PATTERNS[patternKey];
    let stepIndex = 0;

    function executeStep() {
      if (!breathingActive) return;

      const step = steps[stepIndex];
      
      // Update UI instruction
      breathInstruction.textContent = step.action;
      
      // Animate bubble
      breathBubble.style.transition = `transform ${step.duration}s linear, opacity ${step.duration}s linear, filter ${step.duration}s linear`;
      breathBubble.style.transform = `scale(${step.scale})`;
      breathBubble.style.opacity = step.opacity;
      breathBubble.style.filter = `blur(${step.blur}px)`;

      // Queue next step
      breathIntervalId = setTimeout(() => {
        stepIndex = (stepIndex + 1) % steps.length;
        executeStep();
      }, step.duration * 1000);
    }

    executeStep();
  }

  if (breathStartBtn) breathStartBtn.addEventListener("click", startBreathing);
  if (breathStopBtn) breathStopBtn.addEventListener("click", stopBreathing);


  // ==========================================
  // SHARED WEB AUDIO SYSTEM
  // ==========================================
  let audioCtx = null;
  let ambientSystem = null; // Holds nodes for Mixer
  let rippleSynth = null;   // Holds nodes for Ripples

  function initAudio() {
    if (audioCtx) return;
    
    // Create AudioContext
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Set up Ambient Mixer Synths
    setupAmbientSynths();
    
    // Set up Canvas ripple synth
    setupRippleSynth();
  }

  function resumeAudioContext() {
    initAudio();
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
  }


  // ==========================================
  // GAME 2: AMBIENT SOUND MIXER
  // ==========================================
  const audioEnableBtn = document.getElementById("audio-enable-btn");
  const rainVolInput = document.getElementById("volume-rain");
  const oceanVolInput = document.getElementById("volume-ocean");
  const windVolInput = document.getElementById("volume-wind");
  const droneVolInput = document.getElementById("volume-drone");
  
  const rainValText = document.getElementById("val-rain");
  const oceanValText = document.getElementById("val-ocean");
  const windValText = document.getElementById("val-wind");
  const droneValText = document.getElementById("val-drone");

  let isAudioEnabled = false;

  function setupAmbientSynths() {
    ambientSystem = {
      rain: createNoiseSource(600, 0.1, 0.4),  // LP filter at 600Hz for warm rain muffling
      ocean: createOceanSource(),
      wind: createWindSource(),
      drone: createBinauralDrone()
    };
  }

  function createNoiseBuffer() {
    const bufferSize = 2 * audioCtx.sampleRate;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    return noiseBuffer;
  }

  // Basic filtered noise (good for rain)
  function createNoiseSource(cutoffFreq, gainVal, QVal = 1) {
    const bufferSource = audioCtx.createBufferSource();
    bufferSource.buffer = createNoiseBuffer();
    bufferSource.loop = true;

    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(cutoffFreq, audioCtx.currentTime);
    filter.Q.setValueAtTime(QVal, audioCtx.currentTime);

    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime); // start at 0

    bufferSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    bufferSource.start(0);

    return { source: bufferSource, gain: gainNode, filter: filter };
  }

  // Ocean wave simulation: filtered noise modulated by a very slow LFO (low-frequency oscillator)
  function createOceanSource() {
    // Generate filtered noise
    const noise = audioCtx.createBufferSource();
    noise.buffer = createNoiseBuffer();
    noise.loop = true;

    const filter = audioCtx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(400, audioCtx.currentTime);
    filter.Q.setValueAtTime(1.5, audioCtx.currentTime);

    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);

    // LFO to simulate rolling waves (period ~ 8 seconds)
    const lfo = audioCtx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(0.125, audioCtx.currentTime); // 1/8 Hz

    const lfoGain = audioCtx.createGain();
    lfoGain.gain.setValueAtTime(150, audioCtx.currentTime); // modulate filter frequency by +/- 150Hz

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency); // Modulate filter cutoff

    // Second slow gain modulation LFO for volume wave swelling
    const volLfo = audioCtx.createOscillator();
    volLfo.type = "sine";
    volLfo.frequency.setValueAtTime(0.125, audioCtx.currentTime);
    
    const volLfoGain = audioCtx.createGain();
    volLfoGain.gain.setValueAtTime(0.4, audioCtx.currentTime); // sweep gain range

    const baselineGain = audioCtx.createGain();
    baselineGain.gain.setValueAtTime(0.5, audioCtx.currentTime);

    volLfo.connect(volLfoGain);
    
    // Connect nodes
    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // Start modulators
    lfo.start(0);
    volLfo.start(0);
    noise.start(0);

    // Dynamic wave gain modulation trick: we modulate the gainNode slowly
    // By connecting volLfoGain to gainNode.gain
    volLfoGain.connect(gainNode.gain);

    return { source: noise, gain: gainNode, lfo: lfo, volLfo: volLfo };
  }

  // Wind simulation: bandpass filtered noise with fluctuating center frequency
  function createWindSource() {
    const noise = audioCtx.createBufferSource();
    noise.buffer = createNoiseBuffer();
    noise.loop = true;

    const filter = audioCtx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(350, audioCtx.currentTime);
    filter.Q.setValueAtTime(3.0, audioCtx.currentTime); // High Q for whistle effect

    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);

    // Random-ish slow LFO to simulate wind gust frequencies (0.05 Hz - 0.2 Hz)
    const lfo1 = audioCtx.createOscillator();
    lfo1.type = "sine";
    lfo1.frequency.setValueAtTime(0.08, audioCtx.currentTime);

    const lfo1Gain = audioCtx.createGain();
    lfo1Gain.gain.setValueAtTime(120, audioCtx.currentTime); // move between 230Hz and 470Hz

    lfo1.connect(lfo1Gain);
    lfo1Gain.connect(filter.frequency);

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    lfo1.start(0);
    noise.start(0);

    return { source: noise, gain: gainNode, lfo: lfo1 };
  }

  // Binaural Drone: 100Hz in Left Ear, 104Hz in Right Ear
  function createBinauralDrone() {
    const oscL = audioCtx.createOscillator();
    oscL.type = "sine";
    oscL.frequency.setValueAtTime(100, audioCtx.currentTime);

    const oscR = audioCtx.createOscillator();
    oscR.type = "sine";
    oscR.frequency.setValueAtTime(104, audioCtx.currentTime); // 4Hz difference (Delta wave)

    const pannerL = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null;
    const pannerR = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null;

    if (pannerL) pannerL.pan.setValueAtTime(-1, audioCtx.currentTime); // fully panned left
    if (pannerR) pannerR.pan.setValueAtTime(1, audioCtx.currentTime);  // fully panned right

    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);

    // Lowpass filters for each ear to make the drone incredibly soft and round
    const lpL = audioCtx.createBiquadFilter();
    lpL.type = "lowpass";
    lpL.frequency.setValueAtTime(150, audioCtx.currentTime);

    const lpR = audioCtx.createBiquadFilter();
    lpR.type = "lowpass";
    lpR.frequency.setValueAtTime(150, audioCtx.currentTime);

    if (pannerL && pannerR) {
      oscL.connect(lpL).connect(pannerL).connect(gainNode);
      oscR.connect(lpR).connect(pannerR).connect(gainNode);
    } else {
      oscL.connect(lpL).connect(gainNode);
      oscR.connect(lpR).connect(gainNode);
    }

    gainNode.connect(audioCtx.destination);

    oscL.start(0);
    oscR.start(0);

    return { oscL: oscL, oscR: oscR, gain: gainNode };
  }

  // Toggle ambient mixer play/pause
  if (audioEnableBtn) {
    audioEnableBtn.addEventListener("click", () => {
      resumeAudioContext();
      
      isAudioEnabled = !isAudioEnabled;
      if (isAudioEnabled) {
        audioEnableBtn.textContent = "Toggle Audio System: ON";
        audioEnableBtn.className = "btn btn-primary";
        // Apply slider values to gain nodes
        updateMixerVolumes();
      } else {
        audioEnableBtn.textContent = "Toggle Audio System: OFF";
        audioEnableBtn.className = "btn btn-secondary";
        // Silence all generators
        silenceMixer();
      }
    });
  }

  function updateMixerVolumes() {
    if (!isAudioEnabled || !ambientSystem) return;

    const rainVol = parseFloat(rainVolInput.value);
    const oceanVol = parseFloat(oceanVolInput.value);
    const windVol = parseFloat(windVolInput.value);
    const droneVol = parseFloat(droneVolInput.value);

    // Smooth gain transition
    ambientSystem.rain.gain.gain.setTargetAtTime(rainVol * 0.4, audioCtx.currentTime, 0.2);
    ambientSystem.ocean.gain.gain.setTargetAtTime(oceanVol * 0.5, audioCtx.currentTime, 0.4); // waves have slower curve
    ambientSystem.wind.gain.gain.setTargetAtTime(windVol * 0.3, audioCtx.currentTime, 0.2);
    ambientSystem.drone.gain.gain.setTargetAtTime(droneVol * 0.25, audioCtx.currentTime, 0.3); // drone is loud, cap it
  }

  function silenceMixer() {
    if (!ambientSystem) return;
    ambientSystem.rain.gain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
    ambientSystem.ocean.gain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
    ambientSystem.wind.gain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
    ambientSystem.drone.gain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
  }

  // Sliders update bindings
  function setupSliderEvents(inputEl, valTextEl, label) {
    if (inputEl && valTextEl) {
      inputEl.addEventListener("input", () => {
        const val = Math.round(inputEl.value * 100);
        valTextEl.textContent = `${val}%`;
        
        if (isAudioEnabled) {
          updateMixerVolumes();
        }
      });
    }
  }

  setupSliderEvents(rainVolInput, rainValText);
  setupSliderEvents(oceanVolInput, oceanValText);
  setupSliderEvents(windVolInput, windValText);
  setupSliderEvents(droneVolInput, droneValText);


  // ==========================================
  // GAME 3: ZEN SOUND RIPPLES CANVAS
  // ==========================================
  const canvas = document.getElementById("zen-canvas");
  const ctx = canvas ? canvas.getContext("2d") : null;
  const canvasPrompt = document.getElementById("canvas-enable-prompt");
  const clearCanvasBtn = document.getElementById("clear-canvas-btn");

  let ripples = [];
  const PENTATONIC_SCALE = [
    130.81, 146.83, 164.81, 196.00, 220.00, // C3, D3, E3, G3, A3
    261.63, 293.66, 329.63, 392.00, 440.00, // C4, D4, E4, G4, A4
    523.25, 587.33, 659.25, 783.99, 880.00  // C5, D5, E5, G5, A5
  ];

  const RIPPLE_COLORS = [
    "rgba(138, 124, 255, ", // Calm Lavender
    "rgba(77, 158, 255, ",  // Calming Ocean Blue
    "rgba(44, 216, 141, ",  // Soothing Teal
    "rgba(255, 176, 58, ",  // Warm Sunset Orange
    "rgba(255, 104, 133, "  // Soft Pink
  ];

  function setupRippleSynth() {
    // Basic main volume gain for chimes to avoid clipping
    rippleSynth = {
      mainGain: audioCtx.createGain()
    };
    rippleSynth.mainGain.gain.setValueAtTime(0.5, audioCtx.currentTime);
    
    // Add dynamic delay/echo effect for spacey vibe
    const delay = audioCtx.createDelay(1.0);
    delay.delayTime.setValueAtTime(0.35, audioCtx.currentTime); // 350ms echo

    const feedback = audioCtx.createGain();
    feedback.gain.setValueAtTime(0.4, audioCtx.currentTime); // 40% feedback echo

    // Route: Chime -> MainGain -> Output
    // Route: Chime -> Delay -> Feedback -> Delay (loop)
    // Delay -> MainGain (parallel)
    delay.connect(feedback);
    feedback.connect(delay);

    rippleSynth.mainGain.connect(audioCtx.destination);
    delay.connect(rippleSynth.mainGain);

    rippleSynth.delayNode = delay;
  }

  function playChime(yRatio) {
    if (!audioCtx) return;

    // Map canvas height position (yRatio) to Pentatonic scale index
    // Bottom of canvas = index 0 (low pitch), Top of canvas = high pitch
    const scaleIndex = Math.min(
      Math.floor((1 - yRatio) * PENTATONIC_SCALE.length),
      PENTATONIC_SCALE.length - 1
    );
    const frequency = PENTATONIC_SCALE[scaleIndex];

    // Create chime node components
    const osc = audioCtx.createOscillator();
    const subOsc = audioCtx.createOscillator(); // harmonic warmth
    const gainNode = audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);

    subOsc.type = "triangle";
    subOsc.frequency.setValueAtTime(frequency * 0.5, audioCtx.currentTime); // sub octave

    gainNode.gain.setValueAtTime(0.01, audioCtx.currentTime);
    // Envelope: Fast attack, long release
    gainNode.gain.exponentialRampToValueAtTime(0.25, audioCtx.currentTime + 0.05); // attack
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 2.5); // decay

    // Connections
    osc.connect(gainNode);
    subOsc.connect(gainNode);
    
    // Send to main sound ripple channel & echo channel
    gainNode.connect(rippleSynth.mainGain);
    gainNode.connect(rippleSynth.delayNode);

    // Play & dispose
    osc.start(0);
    subOsc.start(0);
    osc.stop(audioCtx.currentTime + 2.6);
    subOsc.stop(audioCtx.currentTime + 2.6);
  }

  class Ripple {
    constructor(x, y, color) {
      this.x = x;
      this.y = y;
      this.radius = 0;
      this.maxRadius = 70 + Math.random() * 50;
      this.alpha = 1.0;
      this.speed = 1.5 + Math.random() * 1.5;
      this.colorBase = color; // base string e.g. "rgba(138, 124, 255, "
    }

    update() {
      this.radius += this.speed;
      this.alpha = 1 - (this.radius / this.maxRadius);
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `${this.colorBase}${this.alpha})`;
      ctx.lineWidth = 3 * this.alpha;
      ctx.stroke();

      // Subtle inner glow ripple
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 0.6, 0, Math.PI * 2);
      ctx.strokeStyle = `${this.colorBase}${this.alpha * 0.4})`;
      ctx.lineWidth = 1.5 * this.alpha;
      ctx.stroke();
    }

    isDone() {
      return this.radius >= this.maxRadius;
    }
  }

  function animateCanvas() {
    if (!ctx) return;
    
    // Clear canvas with a very subtle trail (opacity fade)
    ctx.fillStyle = "rgba(10, 13, 20, 0.15)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ripples = ripples.filter(ripple => {
      ripple.update();
      ripple.draw();
      return !ripple.isDone();
    });

    requestAnimationFrame(animateCanvas);
  }

  function resizeCanvas() {
    if (!canvas) return;
    const rect = canvas.parentNode.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = 400;
  }

  // Handle click / tap on canvas
  if (canvas) {
    canvas.addEventListener("mousedown", (e) => {
      resumeAudioContext();
      
      // Hide prompt instructions overlay
      if (canvasPrompt) {
        canvasPrompt.classList.add("hidden");
      }

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Calculate ratios
      const yRatio = y / canvas.height;

      // Add ripple
      const randomColor = RIPPLE_COLORS[Math.floor(Math.random() * RIPPLE_COLORS.length)];
      ripples.push(new Ripple(x, y, randomColor));

      // Play matching pentatonic chime
      playChime(yRatio);

      // Award small point trigger
      window.SereneApp.addPoints(2);
    });

    // Touch support for mobiles
    canvas.addEventListener("touchstart", (e) => {
      e.preventDefault();
      resumeAudioContext();

      if (canvasPrompt) {
        canvasPrompt.classList.add("hidden");
      }

      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      const yRatio = y / canvas.height;

      const randomColor = RIPPLE_COLORS[Math.floor(Math.random() * RIPPLE_COLORS.length)];
      ripples.push(new Ripple(x, y, randomColor));

      playChime(yRatio);
      window.SereneApp.addPoints(2);
    });

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    animateCanvas();
  }

  if (clearCanvasBtn) {
    clearCanvasBtn.addEventListener("click", () => {
      ripples = [];
      if (ctx) {
        ctx.fillStyle = "#0a0d14";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    });
  }

});
