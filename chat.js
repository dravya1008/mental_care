/**
 * SereneMind - Empathetic Chatbot Engine ("Serene")
 * Simulates warm conversation, responds to user emotions, and guides users through stressful times.
 */

document.addEventListener("DOMContentLoaded", () => {
  const chatMessages = document.getElementById("chat-messages-container");
  const chatInput = document.getElementById("chat-input");
  const chatSendBtn = document.getElementById("chat-send-btn");
  const clearChatBtn = document.getElementById("clear-chat-btn");
  const suggestionContainer = document.getElementById("chat-suggestions-container");

  // Keep track of messages sent by the user in this session
  let userMessageCount = 0;

  // Bot response database based on key phrases
  const BOT_RESPONSES = {
    stress: [
      "I hear you. Feeling stressed can be incredibly exhausting. 😣 Please remember it's okay to feel this way. Can we take a brief pause together? Let's inhale slowly for 4 seconds, and exhale for 4 seconds. How does that sound?",
      "Stress is your body trying to protect you, but sometimes it goes into overdrive. Take a moment to drop your shoulders, unclench your jaw, and let go of any tension. What is one tiny thing you can control right now?"
    ],
    anxiety: [
      "I'm so sorry you're feeling anxious. Anxiety is like a false alarm in the mind, making everything feel urgent. You are safe in this moment. 🌿 Try the 5-4-3-2-1 grounding technique: what are 3 things you can see around you right now?",
      "Take a slow, deep breath. Focus on the physical contact of your feet on the floor. I'm right here with you. Would you like me to walk you through a calming breathing exercise?"
    ],
    panic: [
      "I'm here. You are safe. This intense feeling is a wave, and just like any wave, it WILL peak and it WILL pass. 🌊 Let's do some Box Breathing. Inhale... hold... exhale... hold. Repeat this. Nothing else matters right now but this breath.",
      "If your heart is racing, try running cold water over your hands or placing a cool towel on your face. This activates your vagus nerve and helps slow things down. I am holding this space for you. You are going to be okay."
    ],
    depression: [
      "I'm so sorry things feel heavy and dark right now. 💜 When you're in that deep fog, even small things take monumental effort. Please be incredibly gentle with yourself. You don't have to 'fix' it today. Just existing is enough.",
      "I want you to know that your life has quiet value, and you are not a burden. It's okay if all you did today was breathe. Is there a supportive friend, family member, or professional you feel safe reaching out to?"
    ],
    lonely: [
      "Feeling lonely can make the world feel quiet and distant. But even if we are chatting virtually, please know that your presence matters to me. 🌻 Connection doesn't always have to be big—sometimes sharing a quiet thought is a start. What has been on your mind?",
      "It is a hard feeling to sit with. Sometimes doing a small self-soothing activity, like wrapping up in a warm blanket or making a cup of tea, can help. I'm here to listen if you want to write down what you are feeling."
    ],
    sad: [
      "It's completely okay to feel sad. Crying or feeling low is a natural response to pain, disappointment, or exhaustion. 😢 Don't feel like you need to force a smile. How can I best support you right now? I can listen, guide a relaxation, or we can just sit in quiet conversation.",
      "Tears are how our body releases built-up emotional weight. Allow yourself to feel it. I'm here. What happened that made things feel heavy?"
    ],
    breathing: [
      "Breathing exercises are a direct dial to calm your nervous system. I highly recommend clicking the **Zen Zone Games** tab in the sidebar and starting the **Breathing Bubble**! It has box breathing and 4-7-8 relaxing patterns. Give it a try for just 2 minutes!",
      "Let's do a quick breathing exercise right now. Inhale deeply through your nose, letting your belly expand... Hold it for a moment... Now, let out a long, slow sigh through your mouth. How does that feel?"
    ],
    grounding: [
      "Let's practice the **5-4-3-2-1 Grounding Method** to bring you back to the present moment:\n\n1. Name **5** things you can see.\n2. Name **4** things you can physically touch.\n3. Name **3** things you can hear.\n4. Name **2** things you can smell.\n5. Name **1** thing you can taste.\n\nTake your time. What do you notice first?",
      "Another simple grounding technique is the 'Body Scan'. Feel your weight in your chair, notice the temperature of the air on your skin, and focus on the physical support beneath you. You are here, in the present, and you are safe."
    ],
    default: [
      "Thank you for sharing that with me. I'm here, listening. Can you tell me a little more about how that is making you feel?",
      "I hear you. That sounds like a lot to carry. Remember to take things one moment at a time. What is one small act of self-care you can do for yourself today?",
      "I appreciate your trust in sharing this with me. Remember to be kind to yourself. You are doing the best you can, and that is absolutely enough. 💜",
      "I'm here to support you. Would you like to try a breathing exercise, write down a reflection in your journal, or talk through what's bothering you?"
    ]
  };

  // Greeting variations based on time of day
  function getTimeBasedGreeting() {
    const hrs = new Date().getHours();
    const name = window.SereneApp.state.profile.name || "Guest";
    
    if (hrs < 12) return `Good morning, ${name}. 🌅 How are you feeling today?`;
    if (hrs < 18) return `Good afternoon, ${name}. ☀️ I hope you are taking moments to breathe. How is your day going?`;
    return `Good evening, ${name}. 🌌 How was your day? I'm here to help you unwind and let go of any stress.`;
  }

  // Load chat history from localStorage
  function loadChatHistory() {
    const history = localStorage.getItem("serene_chat_history");
    if (history) {
      const messages = JSON.parse(history);
      chatMessages.innerHTML = "";
      messages.forEach(msg => {
        appendMessageUI(msg.text, msg.sender);
      });
      scrollToBottom();
    } else {
      // Default welcome greeting
      chatMessages.innerHTML = "";
      appendMessageUI(getTimeBasedGreeting(), "bot");
    }
  }

  // Save chat history
  function saveChatHistory() {
    const messages = [];
    chatMessages.querySelectorAll(".chat-message").forEach(msgEl => {
      // Ignore typing bubble
      if (msgEl.classList.contains("typing-bubble")) return;
      
      const isBot = msgEl.classList.contains("bot");
      messages.push({
        text: msgEl.querySelector(".message-content").innerHTML,
        sender: isBot ? "bot" : "user"
      });
    });
    localStorage.setItem("serene_chat_history", JSON.stringify(messages));
  }

  // Append message to UI
  function appendMessageUI(text, sender) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("chat-message", sender);
    
    const contentDiv = document.createElement("div");
    contentDiv.classList.add("message-content");
    contentDiv.innerHTML = text.replace(/\n/g, "<br>");
    
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
  }

  // Auto scroll chat
  function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Show typing indicator
  function showTypingIndicator() {
    const typingDiv = document.createElement("div");
    typingDiv.classList.add("chat-message", "bot", "typing-bubble");
    
    const contentDiv = document.createElement("div");
    contentDiv.classList.add("message-content");
    contentDiv.innerHTML = `
      <div class="typing-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    `;
    
    typingDiv.appendChild(contentDiv);
    chatMessages.appendChild(typingDiv);
    scrollToBottom();
    
    // Toggle typing indicator in sidebar header status
    const statusInd = document.querySelector(".avatar-status .status-indicator");
    if (statusInd) {
      statusInd.className = "status-indicator typing";
    }

    return typingDiv;
  }

  // Remove typing indicator
  function hideTypingIndicator(typingDiv) {
    if (typingDiv && typingDiv.parentNode) {
      typingDiv.parentNode.removeChild(typingDiv);
    }
    const statusInd = document.querySelector(".avatar-status .status-indicator");
    if (statusInd) {
      statusInd.className = "status-indicator online";
    }
  }

  // Analyze text and pick a response
  function getResponse(inputText) {
    const text = inputText.toLowerCase();
    
    if (text.includes("stress") || text.includes("overwhelmed") || text.includes("pressure") || text.includes("exhausted") || text.includes("tired")) {
      return getRandomElement(BOT_RESPONSES.stress);
    }
    if (text.includes("anxious") || text.includes("anxiety") || text.includes("worry") || text.includes("nervous") || text.includes("scared")) {
      return getRandomElement(BOT_RESPONSES.anxiety);
    }
    if (text.includes("panic") || text.includes("heart is racing") || text.includes("cannot breathe") || text.includes("hypervent")) {
      return getRandomElement(BOT_RESPONSES.panic);
    }
    if (text.includes("depression") || text.includes("depressed") || text.includes("hopeless") || text.includes("give up") || text.includes("worthless")) {
      return getRandomElement(BOT_RESPONSES.depression);
    }
    if (text.includes("lonely") || text.includes("loneliness") || text.includes("no one") || text.includes("isolated")) {
      return getRandomElement(BOT_RESPONSES.lonely);
    }
    if (text.includes("sad") || text.includes("crying") || text.includes("hurt") || text.includes("pain") || text.includes("grief")) {
      return getRandomElement(BOT_RESPONSES.sad);
    }
    if (text.includes("breath") || text.includes("breathing") || text.includes("inhale")) {
      return getRandomElement(BOT_RESPONSES.breathing);
    }
    if (text.includes("ground") || text.includes("grounding") || text.includes("54321") || text.includes("distract")) {
      return getRandomElement(BOT_RESPONSES.grounding);
    }
    
    // General helpful fallback responses
    return getRandomElement(BOT_RESPONSES.default);
  }

  function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // Handle user send action
  function handleUserSend(messageText) {
    if (!messageText.trim()) return;

    // Append User message
    appendMessageUI(messageText, "user");
    chatInput.value = "";
    scrollToBottom();
    saveChatHistory();

    userMessageCount++;
    if (userMessageCount >= 2) {
      // Mark chatbot check off in checklist
      window.SereneApp.completeChecklistItem("chat");
    }

    // Trigger typing response
    const typingBubble = showTypingIndicator();
    
    // Simulate thinking/typing delay (1 - 1.5 seconds)
    const delay = 1000 + Math.random() * 800;
    setTimeout(() => {
      hideTypingIndicator(typingBubble);
      
      const botReply = getResponse(messageText);
      appendMessageUI(botReply, "bot");
      scrollToBottom();
      saveChatHistory();
    }, delay);
  }

  // Events Listeners
  if (chatSendBtn) {
    chatSendBtn.addEventListener("click", () => {
      handleUserSend(chatInput.value);
    });
  }

  if (chatInput) {
    chatInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        handleUserSend(chatInput.value);
      }
    });
  }

  // Suggestion chips listeners
  if (suggestionContainer) {
    suggestionContainer.addEventListener("click", (e) => {
      if (e.target.classList.contains("suggestion-chip")) {
        const text = e.target.textContent;
        handleUserSend(text);
      }
    });
  }

  // Restart chat
  if (clearChatBtn) {
    clearChatBtn.addEventListener("click", () => {
      if (confirm("Would you like to restart the conversation? This will clear current session chat history.")) {
        localStorage.removeItem("serene_chat_history");
        chatMessages.innerHTML = "";
        appendMessageUI(getTimeBasedGreeting(), "bot");
        userMessageCount = 0;
      }
    });
  }

  // Listen for custom state change event (e.g. name update in profile)
  window.addEventListener("sereneStateChanged", () => {
    // If chat is completely empty, refresh the welcome message with new name
    if (chatMessages.children.length <= 1) {
      chatMessages.innerHTML = "";
      appendMessageUI(getTimeBasedGreeting(), "bot");
    }
  });

  // Load chat on boot
  loadChatHistory();
});
