(function() {
  const scriptTag = document.currentScript || (function() {
    const scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  const scriptSrc = scriptTag.src;
  const urlParams = new URLSearchParams(scriptSrc.split('?')[1] || '');
  const clientId = urlParams.get('client');

  if (!clientId) {
    console.error('eMart IT Chatbot: No client ID provided');
    return;
  }

  const API = 'https://web-production-1c820.up.railway.app';

  const AVATARS = {
    robot: '🤖', woman: '👩', man: '👨', star: '⭐', chat: '💬',
    heart: '❤️', lightning: '⚡', diamond: '💎', fire: '🔥', crown: '👑'
  };

  let settings = {
    botName: 'Assistant',
    welcomeMessage: 'Hi! How can I help you today? 😊',
    headerColor: '#1a569a',
    bubbleColor: '#1a569a',
    avatar: 'robot',
    position: 'right'
  };

  let conversationHistory = [];
  let isOpen = false;
  let isTyping = false;

  // ── STYLES ──────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #emartit-widget * { box-sizing: border-box; margin: 0; padding: 0; font-family: Arial, sans-serif; }

    #emartit-bubble {
      position: fixed; bottom: 24px; width: 60px; height: 60px;
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      font-size: 28px; cursor: pointer; z-index: 999999;
      box-shadow: 0 4px 20px rgba(0,0,0,0.25);
      transition: transform 0.2s, box-shadow 0.2s;
      animation: emartit-pulse 3s infinite;
    }
    #emartit-bubble:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 28px rgba(0,0,0,0.35);
    }
    @keyframes emartit-pulse {
      0%, 100% { box-shadow: 0 4px 20px rgba(0,0,0,0.25); }
      50% { box-shadow: 0 4px 30px rgba(0,0,0,0.4), 0 0 0 8px rgba(255,255,255,0.1); }
    }

    #emartit-window {
      position: fixed; bottom: 100px; width: 360px; height: 520px;
      background: white; border-radius: 16px; z-index: 999998;
      box-shadow: 0 8px 40px rgba(0,0,0,0.18);
      display: none; flex-direction: column; overflow: hidden;
      animation: emartit-slide-up 0.3s ease-out;
    }
    #emartit-window.open { display: flex; }
    @keyframes emartit-slide-up {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    #emartit-header {
      padding: 14px 16px; color: white;
      display: flex; align-items: center; gap: 10px;
      flex-shrink: 0;
    }
    #emartit-header-avatar { font-size: 22px; }
    #emartit-header-name { font-size: 15px; font-weight: 700; flex: 1; }
    #emartit-header-status { font-size: 11px; opacity: 0.85; }
    #emartit-close {
      background: rgba(255,255,255,0.2); border: none; color: white;
      width: 28px; height: 28px; border-radius: 50%; cursor: pointer;
      font-size: 14px; display: flex; align-items: center; justify-content: center;
    }
    #emartit-close:hover { background: rgba(255,255,255,0.35); }

    #emartit-messages {
      flex: 1; overflow-y: auto; padding: 16px;
      background: #f8fafc; display: flex; flex-direction: column; gap: 10px;
    }
    #emartit-messages::-webkit-scrollbar { width: 4px; }
    #emartit-messages::-webkit-scrollbar-track { background: transparent; }
    #emartit-messages::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }

    .emartit-msg { display: flex; flex-direction: column; max-width: 82%; }
    .emartit-msg.user { align-self: flex-end; align-items: flex-end; }
    .emartit-msg.bot { align-self: flex-start; align-items: flex-start; }

    .emartit-bubble-msg {
      padding: 10px 14px; border-radius: 16px; font-size: 13px;
      line-height: 1.5; word-break: break-word;
    }
    .emartit-msg.user .emartit-bubble-msg { color: white; border-radius: 16px 16px 4px 16px; }
    .emartit-msg.bot .emartit-bubble-msg {
      background: white; color: #1a1a2e;
      border: 1px solid #e2e8f0; border-radius: 16px 16px 16px 4px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }

    .emartit-typing {
      display: flex; align-items: center; gap: 4px; padding: 12px 14px;
      background: white; border: 1px solid #e2e8f0; border-radius: 16px 16px 16px 4px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }
    .emartit-dot {
      width: 7px; height: 7px; border-radius: 50%; background: #94a3b8;
      animation: emartit-bounce 1.2s infinite;
    }
    .emartit-dot:nth-child(2) { animation-delay: 0.2s; }
    .emartit-dot:nth-child(3) { animation-delay: 0.4s; }
    @keyframes emartit-bounce {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-6px); }
    }

    #emartit-input-row {
      display: flex; gap: 8px; padding: 12px 14px;
      border-top: 1px solid #e2e8f0; background: white; flex-shrink: 0;
    }
    #emartit-input {
      flex: 1; padding: 10px 14px; border: 1.5px solid #e2e8f0;
      border-radius: 24px; font-size: 13px; outline: none; resize: none;
    }
    #emartit-input:focus { border-color: #1a569a; }
    #emartit-send {
      width: 40px; height: 40px; border-radius: 50%; border: none;
      color: white; font-size: 16px; cursor: pointer; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      transition: transform 0.15s;
    }
    #emartit-send:hover { transform: scale(1.1); }

    #emartit-powered {
      text-align: center; font-size: 10px; color: #94a3b8;
      padding: 6px; background: white; flex-shrink: 0;
    }
    #emartit-powered a { color: #94a3b8; text-decoration: none; }
    #emartit-powered a:hover { color: #64748b; }

    @media (max-width: 480px) {
      #emartit-window { width: calc(100vw - 20px); height: 70vh; bottom: 90px; }
    }
  `;
  document.head.appendChild(style);

  // ── HTML ────────────────────────────────────────────────
  const widget = document.createElement('div');
  widget.id = 'emartit-widget';
  widget.innerHTML = `
    <div id="emartit-bubble">🤖</div>
    <div id="emartit-window">
      <div id="emartit-header">
        <span id="emartit-header-avatar">🤖</span>
        <div>
          <div id="emartit-header-name">Assistant</div>
          <div id="emartit-header-status">● Online — replies instantly</div>
        </div>
        <button id="emartit-close">✕</button>
      </div>
      <div id="emartit-messages"></div>
      <div id="emartit-input-row">
        <input type="text" id="emartit-input" placeholder="Type a message...">
        <button id="emartit-send">➤</button>
      </div>
      <div id="emartit-powered">Powered by <a href="https://ematity.com" target="_blank">eMart IT</a></div>
    </div>
  `;
  document.body.appendChild(widget);

  // ── ELEMENTS ─────────────────────────────────────────────
  const bubble = document.getElementById('emartit-bubble');
  const window_ = document.getElementById('emartit-window');
  const header = document.getElementById('emartit-header');
  const headerAvatar = document.getElementById('emartit-header-avatar');
  const headerName = document.getElementById('emartit-header-name');
  const closeBtn = document.getElementById('emartit-close');
  const messagesEl = document.getElementById('emartit-messages');
  const input = document.getElementById('emartit-input');
  const sendBtn = document.getElementById('emartit-send');

  // ── APPLY SETTINGS ───────────────────────────────────────
  function applySettings() {
    const avatarEmoji = AVATARS[settings.avatar] || '🤖';
    bubble.textContent = avatarEmoji;
    bubble.style.background = settings.bubbleColor;
    header.style.background = settings.headerColor;
    headerAvatar.textContent = avatarEmoji;
    headerName.textContent = settings.botName;
    sendBtn.style.background = settings.bubbleColor;
    if (settings.position === 'left') {
      bubble.style.left = '24px';
      bubble.style.right = 'auto';
      window_.style.left = '24px';
      window_.style.right = 'auto';
    } else {
      bubble.style.right = '24px';
      bubble.style.left = 'auto';
      window_.style.right = '24px';
      window_.style.left = 'auto';
    }
  }

  // ── LOAD CLIENT SETTINGS ─────────────────────────────────
  async function loadClientSettings() {
    try {
      const res = await fetch(API + '/clients/' + clientId + '/settings');
      const data = await res.json();
      const s = data.settings || {};
      const c = data.client || {};

      settings.botName = s.bot_name || 'Assistant';
      settings.welcomeMessage = s.welcome_message || 'Hi! How can I help you today? 😊';
      settings.headerColor = s.header_color || s.bot_color || '#1a569a';
      settings.bubbleColor = s.bubble_color || s.bot_color || '#1a569a';
      settings.avatar = s.bot_avatar || 'robot';
      settings.position = s.chat_position || 'right';

      applySettings();
      addMessage('bot', settings.welcomeMessage);
    } catch(e) {
      console.log('eMart IT: Could not load settings', e);
      applySettings();
      addMessage('bot', settings.welcomeMessage);
    }
  }

  // ── MESSAGES ─────────────────────────────────────────────
  function addMessage(role, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'emartit-msg ' + role;
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'emartit-bubble-msg';
    if (role === 'user') bubbleDiv.style.background = settings.bubbleColor;
    bubbleDiv.textContent = text;
    msgDiv.appendChild(bubbleDiv);
    messagesEl.appendChild(msgDiv);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return msgDiv;
  }

  function showTyping() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'emartit-msg bot';
    typingDiv.id = 'emartit-typing';
    typingDiv.innerHTML = `<div class="emartit-typing"><div class="emartit-dot"></div><div class="emartit-dot"></div><div class="emartit-dot"></div></div>`;
    messagesEl.appendChild(typingDiv);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function hideTyping() {
    const t = document.getElementById('emartit-typing');
    if (t) t.remove();
  }

  // ── SEND MESSAGE ─────────────────────────────────────────
  async function sendMessage() {
    const text = input.value.trim();
    if (!text || isTyping) return;
    input.value = '';
    isTyping = true;
    sendBtn.disabled = true;

    addMessage('user', text);
    conversationHistory.push({ role: 'user', content: text });
    showTyping();

    try {
      const res = await fetch(API + '/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          message: text,
          conversation_history: conversationHistory.slice(-10)
        })
      });
      const data = await res.json();
      hideTyping();
      const reply = data.reply || 'Sorry, something went wrong.';
      addMessage('bot', reply);
      conversationHistory.push({ role: 'assistant', content: reply });
    } catch(e) {
      hideTyping();
      addMessage('bot', 'Sorry, I am having trouble connecting. Please try again.');
    }

    isTyping = false;
    sendBtn.disabled = false;
    input.focus();
  }

  // ── TOGGLE ───────────────────────────────────────────────
  function toggleWidget() {
    isOpen = !isOpen;
    if (isOpen) {
      window_.classList.add('open');
      bubble.textContent = '✕';
      bubble.style.fontSize = '20px';
      input.focus();
    } else {
      window_.classList.remove('open');
      bubble.textContent = AVATARS[settings.avatar] || '🤖';
      bubble.style.fontSize = '28px';
    }
  }

  // ── EVENTS ───────────────────────────────────────────────
  bubble.addEventListener('click', toggleWidget);
  closeBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    isOpen = true;
    toggleWidget();
  });
  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // ── INIT ─────────────────────────────────────────────────
  applySettings();
  loadClientSettings();

})();
