(function() {

  var clientId = 'demo';
  try {
    var urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('client')) {
      clientId = urlParams.get('client');
    } else {
      var scripts = document.querySelectorAll('script[src*="widget.js"]');
      for (var i = 0; i < scripts.length; i++) {
        var src = scripts[i].getAttribute('src');
        var match = src.match(/client=([^&]+)/);
        if (match) { clientId = match[1]; break; }
      }
    }
  } catch(e) {}

  var API = 'https://web-production-1c820.up.railway.app';
  var conversationHistory = [];
  var isOpen = false;
  var isTyping = false;
  var leadCaptured = false;
  var leadStep = 0;
  var leadData = {};
  var clientSettings = {};

  var settings = {
    botName: 'eMart IT Assistant',
    welcomeMessage: 'Hi there! How can I help you today? 😊',
    headerColor: '#2563eb',
    bubbleColor: '#2563eb',
    avatar: 'robot',
    position: 'right',
    leadCaptureEnabled: false,
    leadCaptureName: true,
    leadCaptureEmail: false,
    leadCapturePhone: false,
    offlineModeEnabled: false,
    offlineMessage: 'We are currently closed. Please leave your details and we will get back to you!',
    businessHours: null,
    timezone: 'Asia/Dhaka',
    quickReplies: []
  };

  var AVATARS = {
    robot: '🤖', woman: '👩', man: '👨', star: '⭐', chat: '💬',
    heart: '❤️', lightning: '⚡', diamond: '💎', fire: '🔥', crown: '👑'
  };

  function isBusinessOpen() {
    if (!settings.offlineModeEnabled || !settings.businessHours) return true;
    try {
      var now = new Date();
      var tz = settings.timezone || 'Asia/Dhaka';
      var localTime = new Date(now.toLocaleString('en-US', {timeZone: tz}));
      var days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
      var dayName = days[localTime.getDay()];
      var hours = settings.businessHours[dayName];
      if (!hours || !hours.enabled) return false;
      var currentMinutes = localTime.getHours() * 60 + localTime.getMinutes();
      var openParts = hours.open.split(':');
      var closeParts = hours.close.split(':');
      var openMinutes = parseInt(openParts[0]) * 60 + parseInt(openParts[1]);
      var closeMinutes = parseInt(closeParts[0]) * 60 + parseInt(closeParts[1]);
      return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
    } catch(e) { return true; }
  }

  var CSS = `
    #emt-btn {
      position: fixed; bottom: 24px; right: 24px;
      width: 58px; height: 58px; border-radius: 50%;
      background: #2563eb; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      z-index: 9999; transition: transform 0.15s;
    }
    #emt-btn:hover { transform: scale(1.08); }
    #emt-btn svg { width: 27px; height: 27px; fill: white; }
    #emt-btn.glow { animation: emtGlow 2s ease-in-out infinite; }
    @keyframes emtGlow {
      0%,100% { box-shadow: 0 0 0 0px rgba(37,99,235,0.6), 0 0 0 0px rgba(37,99,235,0.3); }
      50% { box-shadow: 0 0 0 10px rgba(37,99,235,0.2), 0 0 0 20px rgba(37,99,235,0); }
    }
    #emt-green-dot {
      position: absolute; top: 2px; right: 2px;
      width: 14px; height: 14px;
      background: #22c55e; border-radius: 50%;
      border: 2px solid white; z-index: 3;
    }
    #emt-green-dot.pulse { animation: emtPulse 1.4s infinite; }
    #emt-offline-dot {
      position: absolute; top: 2px; right: 2px;
      width: 14px; height: 14px;
      background: #94a3b8; border-radius: 50%;
      border: 2px solid white; z-index: 3; display: none;
    }
    #emt-live-badge {
      position: fixed; bottom: 90px; right: 24px;
      background: #1e293b; color: white;
      font-size: 11px; font-weight: 600;
      padding: 4px 10px; border-radius: 20px;
      display: flex; align-items: center; gap: 5px;
      z-index: 9999; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      letter-spacing: 0.5px;
    }
    #emt-live-badge-dot {
      width: 7px; height: 7px;
      background: #22c55e; border-radius: 50%;
    }
    #emt-live-badge-dot.pulse { animation: emtPulse 1.4s infinite; }
    @keyframes emtPulse {
      0%,100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.3; transform: scale(0.7); }
    }
    #emt-win {
      position: fixed; bottom: 96px; right: 24px;
      width: 340px; max-height: 520px; border-radius: 16px;
      background: #fff; box-shadow: 0 8px 32px rgba(0,0,0,0.14);
      border: 1.5px solid #d1d5db;
      display: flex; flex-direction: column; overflow: hidden;
      z-index: 9998; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      transition: opacity 0.2s, transform 0.2s;
    }
    #emt-win.emt-hide { opacity: 0; pointer-events: none; transform: translateY(10px); }
    #emt-head {
      padding: 14px 16px;
      display: flex; align-items: center; gap: 10px; flex-shrink: 0;
    }
    #emt-av {
      width: 36px; height: 36px; border-radius: 50%;
      background: rgba(255,255,255,0.2);
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; font-weight: 600; color: white; flex-shrink: 0;
    }
    #emt-head-txt { flex: 1; }
    #emt-head-name { color: white; font-size: 14px; font-weight: 600; }
    #emt-head-status {
      font-size: 11px; margin-top: 3px;
      display: flex; align-items: center; gap: 5px;
    }
    #emt-status-dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: #22c55e; flex-shrink: 0;
      animation: emtPulse 1.4s infinite;
    }
    #emt-status-dot.offline { background: #94a3b8; animation: none; }
    #emt-status-text { color: rgba(255,255,255,0.85); }
    #emt-x {
      background: none; border: none; color: rgba(255,255,255,0.75);
      font-size: 20px; cursor: pointer; line-height: 1; padding: 2px 4px;
    }
    #emt-x:hover { color: white; }
    #emt-msgs {
      flex: 1; padding: 14px; overflow-y: auto;
      display: flex; flex-direction: column; gap: 8px;
      background: #f5f7fb; max-height: 320px;
    }
    #emt-msgs::-webkit-scrollbar { width: 4px; }
    #emt-msgs::-webkit-scrollbar-track { background: transparent; }
    #emt-msgs::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
    .emt-wrap { display: flex; flex-direction: column; gap: 3px; }
    .emt-wrap.u { align-items: flex-end; }
    .emt-wrap.b { align-items: flex-start; }
    .emt-msg {
      max-width: 82%; padding: 9px 13px;
      font-size: 13.5px; line-height: 1.45; word-wrap: break-word;
    }
    .emt-bot {
      background: #fff; border: 1px solid #e5e7eb;
      border-radius: 4px 14px 14px 14px; color: #111827;
    }
    .emt-usr { color: white; border-radius: 14px 4px 14px 14px; }
    .emt-ts { font-size: 10.5px; color: #9ca3af; padding: 0 4px; }
    .emt-typing {
      display: flex; align-items: center; gap: 4px;
      padding: 10px 14px; background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 4px 14px 14px 14px; width: fit-content;
    }
    .emt-typing span {
      width: 7px; height: 7px; background: #9ca3af;
      border-radius: 50%; display: inline-block;
      animation: emtBounce 1.2s infinite;
    }
    .emt-typing span:nth-child(2) { animation-delay: 0.2s; }
    .emt-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes emtBounce {
      0%,60%,100% { transform: translateY(0); opacity: 0.4; }
      30% { transform: translateY(-5px); opacity: 1; }
    }
    #emt-quick-replies {
      padding: 8px 12px; display: flex; flex-wrap: wrap; gap: 6px;
      background: #f5f7fb; border-top: 1px solid #e5e7eb; flex-shrink: 0;
    }
    .emt-qr-btn {
      padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600;
      border: 1.5px solid; cursor: pointer; background: white;
      transition: all 0.15s; white-space: nowrap; text-decoration: none;
      display: inline-block;
    }
    .emt-qr-btn:hover { color: white; }
    #emt-lead-form {
      padding: 16px; background: white; flex-shrink: 0;
      border-top: 1px solid #e5e7eb;
    }
    .emt-lead-input {
      width: 100%; padding: 9px 14px; border: 1.5px solid #d1d5db;
      border-radius: 8px; font-size: 13px; outline: none; margin-bottom: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    .emt-lead-input:focus { border-color: #2563eb; }
    .emt-lead-submit {
      width: 100%; padding: 10px; border: none; border-radius: 8px;
      background: #2563eb; color: white; font-size: 13px; font-weight: 600;
      cursor: pointer; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    .emt-lead-submit:hover { background: #1d4ed8; }
    .emt-lead-title { font-size: 13px; font-weight: 700; color: #111827; margin-bottom: 10px; }
    .emt-lead-skip { text-align: center; margin-top: 8px; font-size: 11px; color: #9ca3af; cursor: pointer; }
    .emt-lead-skip:hover { color: #64748b; }
    #emt-inp-row {
      padding: 10px 12px; display: flex; gap: 8px;
      align-items: center; border-top: 1px solid #e5e7eb;
      background: #fff; flex-shrink: 0;
    }
    #emt-inp {
      flex: 1; border: 1px solid #d1d5db; border-radius: 22px;
      padding: 8px 14px; font-size: 13.5px; outline: none;
      background: #f9fafb; color: #111827;
    }
    #emt-inp:focus { border-color: #2563eb; background: #fff; }
    #emt-inp:disabled { opacity: 0.6; }
    #emt-send {
      width: 34px; height: 34px; border-radius: 50%;
      background: #2563eb; border: none;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; flex-shrink: 0; transition: background 0.15s;
    }
    #emt-send:hover { filter: brightness(1.1); }
    #emt-send:disabled { opacity: 0.5; cursor: not-allowed; }
    #emt-send svg { width: 17px; height: 17px; fill: white; }
    #emt-foot {
      text-align: center; font-size: 10.5px; color: #9ca3af;
      padding: 5px 0 7px; background: #fff; flex-shrink: 0;
    }
    @media (max-width: 480px) {
      #emt-win { width: calc(100vw - 20px); right: 10px; bottom: 88px; }
      #emt-btn { right: 16px; bottom: 16px; }
      #emt-live-badge { right: 16px; bottom: 86px; }
    }
  `;

  var style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  var HTML = `
    <div id="emt-live-badge">
      <div id="emt-live-badge-dot"></div>
      <span id="emt-badge-text">Online</span>
    </div>
    <button id="emt-btn" aria-label="Open chat">
      <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
      <div id="emt-green-dot"></div>
      <div id="emt-offline-dot"></div>
    </button>
    <div id="emt-win" class="emt-hide">
      <div id="emt-head">
        <div id="emt-av">M</div>
        <div id="emt-head-txt">
          <div id="emt-head-name">eMart IT Assistant</div>
          <div id="emt-head-status">
            <div id="emt-status-dot"></div>
            <span id="emt-status-text">Online &mdash; replies instantly</span>
          </div>
        </div>
        <button id="emt-x" aria-label="Close">&#10005;</button>
      </div>
      <div id="emt-msgs"></div>
      <div id="emt-quick-replies" style="display:none"></div>
      <div id="emt-lead-form" style="display:none"></div>
      <div id="emt-inp-row">
        <input id="emt-inp" type="text" placeholder="Type a message…" />
        <button id="emt-send" aria-label="Send">
          <svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>
        </button>
      </div>
      <div id="emt-foot">Powered by <a href="https://www.emartit.com" target="_blank" style="color:#9ca3af">eMart IT</a></div>
    </div>
  `;

  var container = document.createElement('div');
  container.innerHTML = HTML;
  document.body.appendChild(container);

  function getTime() {
    var now = new Date();
    var h = now.getHours(); var m = now.getMinutes();
    var ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return h + ':' + (m < 10 ? '0' + m : m) + ' ' + ap;
  }

  function applySettings() {
    document.getElementById('emt-head').style.background = settings.headerColor;
    document.getElementById('emt-btn').style.background = settings.bubbleColor;
    document.getElementById('emt-send').style.background = settings.bubbleColor;
    document.getElementById('emt-head-name').textContent = settings.botName;
    var avatarEl = document.getElementById('emt-av');
    if (settings.avatar && AVATARS[settings.avatar]) {
      avatarEl.textContent = AVATARS[settings.avatar];
      avatarEl.style.fontSize = '20px';
    } else {
      avatarEl.textContent = settings.botName.charAt(0).toUpperCase();
      avatarEl.style.fontSize = '15px';
    }
    var btn = document.getElementById('emt-btn');
    var win = document.getElementById('emt-win');
    var badge = document.getElementById('emt-live-badge');
    if (settings.position === 'left') {
      btn.style.right = 'auto'; btn.style.left = '24px';
      win.style.right = 'auto'; win.style.left = '24px';
      badge.style.right = 'auto'; badge.style.left = '24px';
    } else {
      btn.style.left = 'auto'; btn.style.right = '24px';
      win.style.left = 'auto'; win.style.right = '24px';
      badge.style.left = 'auto'; badge.style.right = '24px';
    }
    var userStyle = document.createElement('style');
    userStyle.textContent = `.emt-usr { background: ${settings.bubbleColor}; } .emt-qr-btn { border-color: ${settings.bubbleColor}; color: ${settings.bubbleColor}; } .emt-qr-btn:hover { background: ${settings.bubbleColor}; color: white; } .emt-lead-submit { background: ${settings.bubbleColor}; } #emt-inp:focus { border-color: ${settings.bubbleColor}; }`;
    document.head.appendChild(userStyle);

    var open = isBusinessOpen();
    var statusDot = document.getElementById('emt-status-dot');
    var statusText = document.getElementById('emt-status-text');
    var greenDot = document.getElementById('emt-green-dot');
    var offlineDot = document.getElementById('emt-offline-dot');
    var badgeDot = document.getElementById('emt-live-badge-dot');
    var badgeText = document.getElementById('emt-badge-text');
    if (!open) {
      statusDot.classList.add('offline');
      statusText.textContent = 'Currently closed';
      greenDot.style.display = 'none';
      offlineDot.style.display = 'block';
      badgeDot.style.background = '#94a3b8';
      badgeDot.classList.remove('pulse');
      badgeText.textContent = 'Offline';
    } else {
      statusDot.classList.remove('offline');
      statusText.textContent = 'Online \u2014 replies instantly';
      greenDot.style.display = 'block';
      offlineDot.style.display = 'none';
      badgeDot.style.background = '#22c55e';
      badgeDot.classList.add('pulse');
      badgeText.textContent = 'Online';
    }
  }

  // ── SHOW QUICK REPLIES (supports text only OR text+link) ──
  function showQuickReplies() {
    if (!settings.quickReplies || settings.quickReplies.length === 0) return;
    var validReplies = settings.quickReplies.filter(function(qr) {
      var text = typeof qr === 'object' ? qr.text : qr;
      return text && text.trim();
    });
    if (validReplies.length === 0) return;
    var qrEl = document.getElementById('emt-quick-replies');
    qrEl.style.display = 'flex';
    qrEl.innerHTML = validReplies.map(function(qr) {
      var text = typeof qr === 'object' ? qr.text : qr;
      var link = typeof qr === 'object' ? (qr.link || '') : '';
      if (link && link.trim()) {
        // Button with link — opens URL in new tab
        return '<a href="' + link + '" target="_blank" class="emt-qr-btn">🔗 ' + text + '</a>';
      }
      // Button without link — sends as chat message
      return '<button class="emt-qr-btn" onclick="(function(){document.getElementById(\'emt-quick-replies\').style.display=\'none\';emtSendQuickReply(\'' + text.replace(/'/g, "\\'") + '\')})()">' + text + '</button>';
    }).join('');
  }

  window.emtSendQuickReply = function(text) {
    document.getElementById('emt-inp').value = text;
    send();
  };

  function showLeadForm() {
    var fields = [];
    if (settings.leadCaptureName) fields.push({key:'name', label:'Your Name', type:'text', placeholder:'e.g. John Smith'});
    if (settings.leadCaptureEmail) fields.push({key:'email', label:'Email Address', type:'email', placeholder:'e.g. john@email.com'});
    if (settings.leadCapturePhone) fields.push({key:'phone', label:'Phone Number', type:'tel', placeholder:'e.g. +1 234 567 8900'});
    if (fields.length === 0) { leadCaptured = true; return; }
    var formEl = document.getElementById('emt-lead-form');
    var inpRow = document.getElementById('emt-inp-row');
    formEl.style.display = 'block';
    inpRow.style.display = 'none';
    formEl.innerHTML = '<div class="emt-lead-title">👋 Before we chat, please share your details:</div>' +
      fields.map(function(f) {
        return '<input class="emt-lead-input" id="emt-lead-' + f.key + '" type="' + f.type + '" placeholder="' + f.placeholder + '">';
      }).join('') +
      '<button class="emt-lead-submit" onclick="submitLead()">Start Chatting →</button>' +
      '<div class="emt-lead-skip" onclick="skipLead()">Skip for now</div>';
  }

  window.submitLead = function() {
    leadData = {};
    if (settings.leadCaptureName) leadData.name = document.getElementById('emt-lead-name')?.value || '';
    if (settings.leadCaptureEmail) leadData.email = document.getElementById('emt-lead-email')?.value || '';
    if (settings.leadCapturePhone) leadData.phone = document.getElementById('emt-lead-phone')?.value || '';
    if (settings.leadCaptureName && !leadData.name.trim()) {
      document.getElementById('emt-lead-name').style.borderColor = '#dc2626';
      return;
    }
    fetch(API + '/leads/capture', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        client_id: clientId,
        visitor_name: leadData.name || '',
        visitor_email: leadData.email || '',
        visitor_phone: leadData.phone || '',
        message: 'New visitor from chatbot'
      })
    }).catch(function(e) { console.log('Lead capture error:', e); });
    leadCaptured = true;
    document.getElementById('emt-lead-form').style.display = 'none';
    document.getElementById('emt-inp-row').style.display = 'flex';
    var greeting = leadData.name ? 'Thanks ' + leadData.name + '! How can I help you today? 😊' : 'Thanks! How can I help you today? 😊';
    addBotMessage(greeting);
    if (settings.quickReplies && settings.quickReplies.length > 0) showQuickReplies();
    document.getElementById('emt-inp').focus();
  };

  window.skipLead = function() {
    leadCaptured = true;
    document.getElementById('emt-lead-form').style.display = 'none';
    document.getElementById('emt-inp-row').style.display = 'flex';
    if (settings.quickReplies && settings.quickReplies.length > 0) showQuickReplies();
    document.getElementById('emt-inp').focus();
  };

  function addBotMessage(text) {
    var msgs = document.getElementById('emt-msgs');
    var bw = document.createElement('div');
    bw.className = 'emt-wrap b';
    bw.innerHTML = '<div class="emt-msg emt-bot">' + text + '</div><div class="emt-ts">' + getTime() + '</div>';
    msgs.appendChild(bw);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function addUserMessage(text) {
    var msgs = document.getElementById('emt-msgs');
    var uw = document.createElement('div');
    uw.className = 'emt-wrap u';
    uw.innerHTML = '<div class="emt-msg emt-usr">' + text + '</div><div class="emt-ts">' + getTime() + '</div>';
    msgs.appendChild(uw);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function showTyping() {
    var msgs = document.getElementById('emt-msgs');
    var tw = document.createElement('div');
    tw.className = 'emt-wrap b'; tw.id = 'emt-typing';
    tw.innerHTML = '<div class="emt-typing"><span></span><span></span><span></span></div>';
    msgs.appendChild(tw);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function hideTyping() {
    var t = document.getElementById('emt-typing');
    if (t) t.remove();
  }

  async function loadClientSettings() {
    try {
      var res = await fetch(API + '/clients/' + clientId + '/settings');
      var data = await res.json();
      var s = data.settings || {};
      if (s.bot_name) settings.botName = s.bot_name;
      if (s.welcome_message) settings.welcomeMessage = s.welcome_message;
      if (s.header_color) settings.headerColor = s.header_color;
      if (s.bubble_color) settings.bubbleColor = s.bubble_color;
      else if (s.bot_color) { settings.headerColor = s.bot_color; settings.bubbleColor = s.bot_color; }
      if (s.bot_avatar) settings.avatar = s.bot_avatar;
      if (s.chat_position) settings.position = s.chat_position;
      settings.leadCaptureEnabled = s.lead_capture_enabled || false;
      settings.leadCaptureName = s.lead_capture_name !== false;
      settings.leadCaptureEmail = s.lead_capture_email || false;
      settings.leadCapturePhone = s.lead_capture_phone || false;
      settings.offlineModeEnabled = s.offline_mode_enabled || false;
      settings.offlineMessage = s.offline_message || 'We are currently closed. Please leave your details and we will get back to you!';
      settings.businessHours = s.business_hours || null;
      settings.timezone = s.timezone || 'Asia/Dhaka';
      settings.quickReplies = (s.quick_replies || []).map(function(qr) {
        return typeof qr === 'string' ? {text: qr, link: ''} : {text: qr.text || '', link: qr.link || ''};
      });
      applySettings();
    } catch(e) {
      console.log('eMart IT: using default settings');
      applySettings();
    }

    var open = isBusinessOpen();
    if (!open && settings.offlineModeEnabled) {
      addBotMessage(settings.offlineMessage);
      setTimeout(function() { showOfflineLeadForm(); }, 800);
    } else {
      addBotMessage(settings.welcomeMessage);
      // Show quick replies first
      if (settings.quickReplies && settings.quickReplies.length > 0) {
        showQuickReplies();
      }
      // Then show lead form after short delay
      if (settings.leadCaptureEnabled) {
        setTimeout(function() { showLeadForm(); }, 400);
      }
    }
  }

  function showOfflineLeadForm() {
    var formEl = document.getElementById('emt-lead-form');
    var inpRow = document.getElementById('emt-inp-row');
    formEl.style.display = 'block';
    inpRow.style.display = 'none';
    formEl.innerHTML = '<div class="emt-lead-title">📩 Leave your details and we\'ll get back to you:</div>' +
      '<input class="emt-lead-input" id="emt-offline-name" type="text" placeholder="Your Name">' +
      '<input class="emt-lead-input" id="emt-offline-phone" type="tel" placeholder="Phone Number">' +
      '<input class="emt-lead-input" id="emt-offline-email" type="email" placeholder="Email Address (optional)">' +
      '<textarea class="emt-lead-input" id="emt-offline-msg" placeholder="Your message..." rows="3" style="resize:none;font-family:inherit"></textarea>' +
      '<button class="emt-lead-submit" onclick="submitOfflineLead()">Send Message →</button>';
  }

  window.submitOfflineLead = function() {
    var name = document.getElementById('emt-offline-name')?.value || '';
    var phone = document.getElementById('emt-offline-phone')?.value || '';
    var email = document.getElementById('emt-offline-email')?.value || '';
    if (!name.trim()) {
      document.getElementById('emt-offline-name').style.borderColor = '#dc2626';
      return;
    }
    fetch(API + '/leads/capture', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        client_id: clientId,
        visitor_name: name,
        visitor_email: email,
        visitor_phone: phone,
        message: document.getElementById('emt-offline-msg')?.value || 'Offline message — business was closed'
      })
    }).catch(function(e) { console.log('Offline lead error:', e); });
    document.getElementById('emt-lead-form').innerHTML =
      '<div style="text-align:center;padding:16px 0"><div style="font-size:24px;margin-bottom:8px">✅</div><div style="font-size:14px;font-weight:600;color:#166534">Thanks ' + name + '!</div><div style="font-size:12px;color:#64748b;margin-top:4px">We\'ll get back to you as soon as we\'re open.</div></div>';
  };

  async function send() {
    var inp = document.getElementById('emt-inp');
    var sendBtn = document.getElementById('emt-send');
    var text = inp.value.trim();
    if (!text || isTyping) return;
    var open = isBusinessOpen();
    if (!open && settings.offlineModeEnabled) {
      addUserMessage(text);
      inp.value = '';
      addBotMessage(settings.offlineMessage);
      return;
    }
    isTyping = true;
    inp.value = ''; inp.disabled = true; sendBtn.disabled = true;
    document.getElementById('emt-quick-replies').style.display = 'none';
    addUserMessage(text);
    conversationHistory.push({role: 'user', content: text});
    showTyping();
    try {
      var res = await fetch(API + '/chat', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          client_id: clientId,
          message: text,
          conversation_history: conversationHistory.slice(-10)
        })
      });
      var data = await res.json();
      hideTyping();
      var reply = data.reply || 'Sorry, something went wrong.';
      addBotMessage(reply);
      conversationHistory.push({role: 'assistant', content: reply});
    } catch(e) {
      hideTyping();
      addBotMessage('Sorry, I am having trouble connecting. Please try again.');
    }
    isTyping = false;
    inp.disabled = false; sendBtn.disabled = false; inp.focus();
  }

  function startAnimation() {
    document.getElementById('emt-btn').classList.add('glow');
    document.getElementById('emt-green-dot').classList.add('pulse');
    document.getElementById('emt-live-badge-dot').classList.add('pulse');
  }

  function stopAnimation() {
    document.getElementById('emt-btn').classList.remove('glow');
  }

  function toggle() {
    isOpen = !isOpen;
    document.getElementById('emt-win').classList.toggle('emt-hide', !isOpen);
    document.getElementById('emt-live-badge').style.display = isOpen ? 'none' : 'flex';
    if (isOpen) {
      stopAnimation();
      document.getElementById('emt-inp').focus();
    } else {
      startAnimation();
    }
  }

  document.getElementById('emt-btn').onclick = toggle;
  document.getElementById('emt-x').onclick = toggle;
  document.getElementById('emt-send').onclick = send;
  document.getElementById('emt-inp').onkeydown = function(e) { if (e.key === 'Enter') send(); };

  applySettings();
  startAnimation();
  loadClientSettings();

})();
