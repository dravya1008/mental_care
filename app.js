/**
 * SereneMind - Global App Coordinator
 * Coordinates state, LocalStorage data, tab switching, and general utility methods.
 */

// Global namespace to share state and triggers across separate scripts
window.SereneApp = {
  state: {
    profile: {
      name: "Guest",
      avatar: "😊",
      focus: "stress",
      assessment: []
    },
    logs: [],
    streak: 0,
    points: 0,
    checklist: {
      date: "",
      mood: false,
      chat: false,
      game: false,
      journal: false
    },
    lastVisitDate: ""
  },

  // Save current state to LocalStorage
  saveState() {
    localStorage.setItem("serene_profile", JSON.stringify(this.state.profile));
    localStorage.setItem("serene_logs", JSON.stringify(this.state.logs));
    localStorage.setItem("serene_streak", this.state.streak.toString());
    localStorage.setItem("serene_points", this.state.points.toString());
    localStorage.setItem("serene_checklist", JSON.stringify(this.state.checklist));
    localStorage.setItem("serene_last_visit", this.state.lastVisitDate);
    
    // Fire a custom event so other modules know state has changed
    window.dispatchEvent(new CustomEvent("sereneStateChanged"));
  },

  // Load state from LocalStorage or initialize with defaults
  loadState() {
    const cachedProfile = localStorage.getItem("serene_profile");
    const cachedLogs = localStorage.getItem("serene_logs");
    const cachedStreak = localStorage.getItem("serene_streak");
    const cachedPoints = localStorage.getItem("serene_points");
    const cachedChecklist = localStorage.getItem("serene_checklist");
    const cachedLastVisit = localStorage.getItem("serene_last_visit");

    if (cachedProfile) this.state.profile = JSON.parse(cachedProfile);
    if (cachedLogs) this.state.logs = JSON.parse(cachedLogs);
    if (cachedStreak) this.state.streak = parseInt(cachedStreak, 10);
    if (cachedPoints) this.state.points = parseInt(cachedPoints, 10);
    if (cachedLastVisit) this.state.lastVisitDate = cachedLastVisit;

    const todayStr = this.getTodayDateString();

    // Check/reset daily checklist
    if (cachedChecklist) {
      const parsedChecklist = JSON.parse(cachedChecklist);
      if (parsedChecklist.date === todayStr) {
        this.state.checklist = parsedChecklist;
      } else {
        // New day: reset checklist
        this.state.checklist = {
          date: todayStr,
          mood: false,
          chat: false,
          game: false,
          journal: false
        };
      }
    } else {
      this.state.checklist.date = todayStr;
    }

    // Process daily streak logic
    this.updateStreakLogic();
    
    // Seed dummy data if a completely new user (to make the charts look good instantly!)
    if (this.state.logs.length === 0) {
      this.seedDummyLogs();
    }
  },

  // Daily streak check
  updateStreakLogic() {
    const todayStr = this.getTodayDateString();
    
    if (this.state.lastVisitDate !== todayStr) {
      const yesterdayStr = this.getYesterdayDateString();
      
      if (this.state.lastVisitDate === yesterdayStr) {
        // Visited yesterday, increment streak
        this.state.streak = (this.state.streak || 0) + 1;
      } else if (this.state.lastVisitDate === "") {
        // Brand new user
        this.state.streak = 1;
      } else {
        // Streak broken
        this.state.streak = 1;
      }
      this.state.lastVisitDate = todayStr;
      this.saveState();
    }
  },

  // Seed default data for visual display
  seedDummyLogs() {
    const moods = ["Calm", "Happy", "Anxious", "Calm", "Stressed", "Calm", "Happy"];
    const sleep = [7.5, 8, 6, 7.5, 5.5, 7, 8];
    const mindful = [10, 15, 5, 20, 0, 10, 15];
    
    const logs = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      logs.push({
        date: dateStr,
        mood: moods[6 - i],
        sleep: sleep[6 - i],
        mindful: mindful[6 - i],
        journal: i === 0 ? "Feeling a bit stressed about starting the week, but excited to track my wellness progress." : "Had a restful night. Enjoyed practicing box breathing today."
      });
    }
    this.state.logs = logs;
    this.state.points = 150; // Welcome points
    this.saveState();
  },

  // Reward points for tasks
  addPoints(amount) {
    this.state.points += amount;
    this.saveState();
    this.updateStatsUI();
  },

  // Check off checklist task
  completeChecklistItem(itemKey) {
    if (!this.state.checklist[itemKey]) {
      this.state.checklist[itemKey] = true;
      this.addPoints(25); // 25 Zen Points per checklist completion
      this.saveState();
      
      // Update UI checkbox elements
      const cb = document.getElementById(`check-${itemKey}`);
      if (cb) cb.checked = true;
    }
  },

  // UI helpers
  getTodayDateString() {
    return new Date().toISOString().split("T")[0];
  },

  getYesterdayDateString() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split("T")[0];
  },

  updateStatsUI() {
    const streakEl = document.getElementById("streak-count");
    const pointsEl = document.getElementById("points-count");
    if (streakEl) streakEl.textContent = this.state.streak;
    if (pointsEl) pointsEl.textContent = this.state.points;
    
    // Sidebar peek UI
    const peekNameEl = document.getElementById("peek-name");
    const peekAvatarEl = document.getElementById("peek-avatar");
    if (peekNameEl) peekNameEl.textContent = this.state.profile.name;
    if (peekAvatarEl) peekAvatarEl.textContent = this.state.profile.avatar;
  }
};

// Soothing Wellness Quotes
const WELLNESS_QUOTES = [
  { text: "Your present stress is only a visitor, not your permanent identity. Let it pass.", author: "Mental Health Alliance" },
  { text: "You don't have to control your thoughts. You just have to stop letting them control you.", author: "Dan Millman" },
  { text: "Almost everything will work again if you unplug it for a few minutes, including you.", author: "Anne Lamott" },
  { text: "Deep breathing is like an anchor in the midst of an emotional storm.", author: "Zen Proverb" },
  { text: "Tension is who you think you should be. Relaxation is who you are.", author: "Chinese Proverb" },
  { text: "Out of difficulties grow miracles.", author: "Jean de la Bruyère" },
  { text: "Self-care is not selfish. You cannot pour from an empty cup.", author: "Eleanor Brownn" },
  { text: "It's okay to feel overwhelmed. Just breathe, and take one tiny step at a time.", author: "SereneMind Guide" }
];

// Document Initialization
document.addEventListener("DOMContentLoaded", () => {
  // Load State
  window.SereneApp.loadState();
  window.SereneApp.updateStatsUI();

  // Tab Navigation Handling
  const navItems = document.querySelectorAll(".nav-item");
  const tabContents = document.querySelectorAll(".tab-content");
  const pageTitle = document.getElementById("page-title");
  const pageSubtitle = document.getElementById("page-subtitle");
  const sidebar = document.getElementById("sidebar");
  const mobileToggle = document.getElementById("mobile-toggle");

  const tabMeta = {
    "dashboard-tab": { title: "Wellness Dashboard", subtitle: "Reflect on your metrics and check your daily routine." },
    "chat-tab": { title: "Speak with Serene", subtitle: "I am here to listen, support, and guide you without judgment." },
    "games-tab": { title: "The Zen Zone", subtitle: "Immerse yourself in sensory, calming activities to relax your mind." },
    "profile-tab": { title: "Your Profile", subtitle: "Customize your parameters and review stress diagnostics." }
  };

  navItems.forEach(item => {
    item.addEventListener("click", () => {
      const tabId = item.getAttribute("data-tab");
      
      // Deactivate current tabs
      navItems.forEach(n => n.classList.remove("active"));
      tabContents.forEach(c => c.classList.remove("active"));

      // Activate selected tab
      item.classList.add("active");
      const activeTab = document.getElementById(tabId);
      if (activeTab) activeTab.classList.add("active");

      // Update titles
      if (tabMeta[tabId]) {
        pageTitle.textContent = tabMeta[tabId].title;
        pageSubtitle.textContent = tabMeta[tabId].subtitle;
      }

      // Close sidebar on mobile after clicking
      if (sidebar.classList.contains("open")) {
        sidebar.classList.remove("open");
      }
      
      // Dispatch window resize trigger to ensure Chart.js scales correctly when tabs change
      window.dispatchEvent(new Event("resize"));
    });
  });

  // Mobile navigation drawer toggle
  if (mobileToggle) {
    mobileToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      sidebar.classList.toggle("open");
    });
  }

  // Close sidebar on body click if open
  document.addEventListener("click", (e) => {
    if (window.innerWidth <= 768 && sidebar.classList.contains("open")) {
      if (!sidebar.contains(e.target) && e.target !== mobileToggle) {
        sidebar.classList.remove("open");
      }
    }
  });

  // Daily Quote logic
  const quoteTextEl = document.getElementById("daily-quote");
  const quoteAuthorEl = document.getElementById("daily-quote-author");
  const newQuoteBtn = document.getElementById("new-quote-btn");

  function displayRandomQuote() {
    const randomIndex = Math.floor(Math.random() * WELLNESS_QUOTES.length);
    const quote = WELLNESS_QUOTES[randomIndex];
    if (quoteTextEl && quoteAuthorEl) {
      quoteTextEl.style.opacity = 0;
      setTimeout(() => {
        quoteTextEl.textContent = `"${quote.text}"`;
        quoteAuthorEl.textContent = `${quote.author}`;
        quoteTextEl.style.opacity = 1;
      }, 200);
    }
  }

  if (newQuoteBtn) {
    newQuoteBtn.addEventListener("click", displayRandomQuote);
  }
  // Initialize with a quote
  displayRandomQuote();

  // Initialize Checklist checkboxes state in UI
  const cbMood = document.getElementById("check-mood");
  const cbChat = document.getElementById("check-chat");
  const cbGame = document.getElementById("check-game");
  const cbJournal = document.getElementById("check-journal");

  if (cbMood) cbMood.checked = window.SereneApp.state.checklist.mood;
  if (cbChat) cbChat.checked = window.SereneApp.state.checklist.chat;
  if (cbGame) cbGame.checked = window.SereneApp.state.checklist.game;
  if (cbJournal) cbJournal.checked = window.SereneApp.state.checklist.journal;

  // Make checkboxes read-only or self-updating based on state
  [cbMood, cbChat, cbGame, cbJournal].forEach(cb => {
    if (cb) {
      cb.addEventListener("click", (e) => {
        // Prevent manual checking: checklist is completed by doing the activities!
        e.preventDefault();
      });
    }
  });
});
