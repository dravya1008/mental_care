/**
 * SereneMind - Dashboard & Profile Controller
 * Controls logging, Chart.js visualization, journaling, stress assessment, and profile settings.
 */

document.addEventListener("DOMContentLoaded", () => {
  // --- DOM Elements ---
  const moodBtns = document.querySelectorAll(".mood-btn");
  const sleepInput = document.getElementById("sleep-hours");
  const mindfulInput = document.getElementById("mindful-mins");
  const logSubmitBtn = document.getElementById("log-submit-btn");

  const journalInput = document.getElementById("journal-input");
  const journalSaveBtn = document.getElementById("journal-save-btn");
  const logsContainer = document.getElementById("recent-logs");

  const profileNameInput = document.getElementById("profile-name-input");
  const avatarBtns = document.querySelectorAll(".avatar-select-btn");
  const focusSelect = document.getElementById("wellness-focus");
  const saveProfileBtn = document.getElementById("save-profile-btn");

  const assessmentCheckboxes = document.querySelectorAll(".assessment-checkbox");
  const assessmentResult = document.getElementById("assessment-result");

  const exportDataBtn = document.getElementById("export-data-btn");
  const clearDataBtn = document.getElementById("clear-data-btn");

  // App State references
  const app = window.SereneApp;

  let selectedMood = "";
  let chartInstance = null;

  // ==========================================
  // LOGGING SYSTEM & FORMS
  // ==========================================

  // Mood selection button toggles
  moodBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      moodBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedMood = btn.getAttribute("data-mood");
    });
  });

  // Submit Logger values
  if (logSubmitBtn) {
    logSubmitBtn.addEventListener("click", () => {
      if (!selectedMood) {
        alert("Please select a mood emoji first.");
        return;
      }

      const todayStr = app.getTodayDateString();
      const sleepHours = parseFloat(sleepInput.value) || 0;
      const mindfulMins = parseInt(mindfulInput.value, 10) || 0;
      const journalText = journalInput ? journalInput.value.trim() : "";

      // Check if entry for today already exists
      const existingIndex = app.state.logs.findIndex(log => log.date === todayStr);

      const entry = {
        date: todayStr,
        mood: selectedMood,
        sleep: sleepHours,
        mindful: mindfulMins,
        journal: journalText
      };

      if (existingIndex >= 0) {
        // Update existing log
        // Merge journal text if not entered today but existed before
        if (!journalText && app.state.logs[existingIndex].journal) {
          entry.journal = app.state.logs[existingIndex].journal;
        }
        app.state.logs[existingIndex] = entry;
      } else {
        // Add new log
        app.state.logs.push(entry);
      }

      // Sort logs chronologically
      app.state.logs.sort((a, b) => new Date(a.date) - new Date(b.date));

      // Mark moodlogged checklist item
      app.completeChecklistItem("mood");

      // Save state
      app.saveState();
      
      // Update UI components
      renderLogsList();
      renderChart();
      
      // Reset logging selections
      moodBtns.forEach(b => b.classList.remove("active"));
      selectedMood = "";
      sleepInput.value = "";
      mindfulInput.value = "";

      alert("Daily metrics logged successfully! You've earned Zen Points.");
    });
  }

  // Save Journal entry independently
  if (journalSaveBtn) {
    journalSaveBtn.addEventListener("click", () => {
      const text = journalInput.value.trim();
      if (!text) {
        alert("Please write something in the journal box before saving.");
        return;
      }

      const todayStr = app.getTodayDateString();
      const existingIndex = app.state.logs.findIndex(log => log.date === todayStr);

      if (existingIndex >= 0) {
        app.state.logs[existingIndex].journal = text;
      } else {
        // Create an empty log shell containing only the journal text
        app.state.logs.push({
          date: todayStr,
          mood: "Calm", // default filler
          sleep: 0,
          mindful: 0,
          journal: text
        });
      }

      // Mark journal checklist item
      app.completeChecklistItem("journal");
      app.saveState();
      
      renderLogsList();
      alert("Reflection entry saved safely. Journal checklist item cleared!");
    });
  }

  // ==========================================
  // CHART DATA RENDERING (CHART.JS)
  // ==========================================
  const moodValueMapping = {
    "Sad": 1,
    "Stressed": 2,
    "Anxious": 3,
    "Calm": 4,
    "Happy": 5
  };

  function renderChart() {
    const canvas = document.getElementById("moodChart");
    if (!canvas) return;

    // Get last 7 logs
    const recentLogs = app.state.logs.slice(-7);
    
    // Labels (dates formatted like Jun 29)
    const labels = recentLogs.map(log => {
      const date = new Date(log.date + "T00:00:00");
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    });

    const moodData = recentLogs.map(log => moodValueMapping[log.mood] || 3);
    const mindfulData = recentLogs.map(log => log.mindful);

    if (chartInstance) {
      chartInstance.destroy();
    }

    // Custom dark-mode styles for grid and ticks
    const gridColor = "rgba(255, 255, 255, 0.05)";
    const textColor = "#8c9ba5";

    // Chart.js config
    chartInstance = new Chart(canvas, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Mood Score",
            data: moodData,
            borderColor: "#8a7cff", // lavender
            backgroundColor: "rgba(138, 124, 255, 0.05)",
            borderWidth: 3,
            tension: 0.35,
            fill: true,
            yAxisID: "yMood",
            pointBackgroundColor: "#8a7cff",
            pointHoverRadius: 8
          },
          {
            label: "Mindfulness (mins)",
            data: mindfulData,
            borderColor: "#4d9eff", // blue
            backgroundColor: "rgba(77, 158, 255, 0.05)",
            borderWidth: 3,
            tension: 0.35,
            fill: true,
            yAxisID: "yMindful",
            pointBackgroundColor: "#4d9eff",
            pointHoverRadius: 8
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false // We use our own custom styled header legend
          },
          tooltip: {
            backgroundColor: "#111625",
            titleFont: { family: "Outfit", size: 13 },
            bodyFont: { family: "Inter", size: 12 },
            borderColor: "rgba(255, 255, 255, 0.08)",
            borderWidth: 1,
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || "";
                if (context.datasetIndex === 0) {
                  const moodLabels = ["", "Sad 😢", "Stressed 🤯", "Anxious 🥺", "Calm 🧘", "Happy 😊"];
                  return `${label}: ${moodLabels[context.raw]}`;
                }
                return `${label}: ${context.raw} mins`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: gridColor },
            ticks: { color: textColor, font: { family: "Inter", size: 11 } }
          },
          yMood: {
            position: "left",
            min: 1,
            max: 5,
            grid: { drawOnChartArea: false },
            ticks: {
              color: textColor,
              stepSize: 1,
              font: { family: "Inter", size: 11 },
              callback: function(value) {
                const moodLabels = ["", "Sad", "Stress", "Anxious", "Calm", "Happy"];
                return moodLabels[value] || "";
              }
            }
          },
          yMindful: {
            position: "right",
            min: 0,
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              font: { family: "Inter", size: 11 },
              callback: function(value) {
                return value + "m";
              }
            }
          }
        }
      }
    });
  }

  // ==========================================
  // RENDER LOG FEED list
  // ==========================================
  function renderLogsList() {
    if (!logsContainer) return;
    
    // Sort logs descending (latest first)
    const reversedLogs = [...app.state.logs].reverse().slice(0, 10); // cap to 10 entries in view

    if (reversedLogs.length === 0) {
      logsContainer.innerHTML = `<div class="no-logs">No activity logged yet. Take a moment to log your first record!</div>`;
      return;
    }

    const moodEmojiMapping = {
      "Happy": "😊",
      "Calm": "🧘",
      "Anxious": "🥺",
      "Stressed": "🤯",
      "Sad": "😢"
    };

    logsContainer.innerHTML = reversedLogs.map(log => {
      const date = new Date(log.date + "T00:00:00");
      const dateStr = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      const emoji = moodEmojiMapping[log.mood] || "🙂";
      const journalSnippet = log.journal ? `<div class="log-journal-snippet">"<i>${log.journal}</i>"</div>` : "";

      return `
        <div class="log-item">
          <div>
            <div class="log-mood-indicator">
              <span>${emoji}</span>
              <span>Logged: ${log.mood}</span>
            </div>
            <div class="log-details">
              <span>🛏️ ${log.sleep}h sleep</span> &bull; 
              <span>🧘 ${log.mindful}m mindful</span>
            </div>
            ${journalSnippet}
          </div>
          <div class="log-date">${dateStr}</div>
        </div>
      `;
    }).join("");
  }


  // ==========================================
  // PROFILE TAB CONTROLLER
  // ==========================================
  
  // Set up profile inputs from state on load
  function loadProfileFormValues() {
    if (profileNameInput) profileNameInput.value = app.state.profile.name;
    if (focusSelect) focusSelect.value = app.state.profile.focus;
    
    // Active avatar matching
    avatarBtns.forEach(btn => {
      if (btn.textContent === app.state.profile.avatar) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    // Stress checkboxes checking
    assessmentCheckboxes.forEach(cb => {
      if (app.state.profile.assessment && app.state.profile.assessment.includes(cb.value)) {
        cb.checked = true;
      } else {
        cb.checked = false;
      }
    });

    calculateStressAssessment();
  }

  // Click handler for avatar selector
  let selectedAvatar = app.state.profile.avatar;
  avatarBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      avatarBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedAvatar = btn.textContent;
    });
  });

  // Save profile setup form
  if (saveProfileBtn) {
    saveProfileBtn.addEventListener("click", () => {
      const nameVal = profileNameInput.value.trim() || "Guest";
      
      app.state.profile.name = nameVal;
      app.state.profile.avatar = selectedAvatar;
      app.state.profile.focus = focusSelect.value;
      
      // Save checklist symptoms
      const symptoms = [];
      assessmentCheckboxes.forEach(cb => {
        if (cb.checked) symptoms.push(cb.value);
      });
      app.state.profile.assessment = symptoms;

      app.saveState();
      app.updateStatsUI();

      alert("Settings updated successfully!");
    });
  }

  // Calculate stress level assessment indicator
  function calculateStressAssessment() {
    if (!assessmentResult) return;

    let checkedCount = 0;
    assessmentCheckboxes.forEach(cb => {
      if (cb.checked) checkedCount++;
    });

    assessmentResult.className = "assessment-result"; // Reset classes

    if (checkedCount <= 1) {
      assessmentResult.classList.add("low");
      assessmentResult.innerHTML = `<strong>Mild/Low Stress Level (Score: ${checkedCount}/6)</strong><br><small>You seem to be handling stress well. Continue regular mindfulness and sleep routines!</small>`;
    } else if (checkedCount <= 3) {
      assessmentResult.classList.add("moderate");
      assessmentResult.innerHTML = `<strong>Moderate Stress Level (Score: ${checkedCount}/6)</strong><br><small>You are experiencing moderate strain. Try scheduling 10 minutes of daily Zen breathing and chatting with Serene.</small>`;
    } else {
      assessmentResult.classList.add("high");
      assessmentResult.innerHTML = `<strong>High Stress / Heavy Burnout (Score: ${checkedCount}/6)</strong><br><small>Your stress indicator is high. Please prioritize rest, try our Zen soundscapes, and consider speaking to a professional for support.</small>`;
    }
  }

  // Checkboxes change listeners
  assessmentCheckboxes.forEach(cb => {
    cb.addEventListener("change", calculateStressAssessment);
  });


  // ==========================================
  // DATA MANAGEMENT & EXPORTS
  // ==========================================

  // Export LocalStorage as JSON file
  if (exportDataBtn) {
    exportDataBtn.addEventListener("click", () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(app.state, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `serenemind_backup_${app.getTodayDateString()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    });
  }

  // Factory reset app data
  if (clearDataBtn) {
    clearDataBtn.addEventListener("click", () => {
      if (confirm("⚠️ WARNING: This will permanently delete all your mood tracking logs, journal entries, and profile achievements. This cannot be undone.\n\nAre you sure you want to clear all data?")) {
        localStorage.clear();
        alert("All app records have been cleared. The page will now reload to start fresh.");
        window.location.reload();
      }
    });
  }

  // ==========================================
  // BOOTSTRAP INITIALIZATION
  // ==========================================
  renderChart();
  renderLogsList();
  loadProfileFormValues();

  // Listen for external app updates (to re-render stats if checklist gets ticked off elsewhere)
  window.addEventListener("sereneStateChanged", () => {
    loadProfileFormValues();
  });
});
