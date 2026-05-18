(function() {

  var clientId = 'demo';
  try {
    var scripts = document.querySelectorAll('script[src*="widget.js"]');
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].getAttribute('src');
      var match = src.match(/client=([^&]+)/);
      if (match) { clientId = match[1]; break; }
    }
  } catch(e) {}

  var CSS = `
    #emt-btn {
      position: fixed; bottom: 24px; right: 24px;
      width: 58px; height: 58px; border-radius: 50%;
      background: #2563eb; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      z-index: 9999; transition: transform 0.15s;
      animation: emtGlow 2s ease-in-out infinite;
    }
    #emt-btn:hover { transform: scale(1.08); }
    #emt-btn svg { width: 27px; height: 27px; fill: white; }
    @keyframes emtGlow {
      0%,100% { box-shadow: 0 0 0 0px rgba(37,99,235,0.6), 0 0 0 0px rgba(37,99,235,0.3); }
      50% { box-shadow: 0 0 0 10px rgba(37,99,235,0.2), 0 0 0 20px rgba(37,99,235,0); }
    }
    #emt-green-dot {
      position: absolute; top: 2px; right: 2px;
      width: 14px; height: 14px;
      background: #22c55e; border-radius: 50%;
      border: 2px solid white;
      animation: emtPulse 1.4s infinite;
      z-index: 3;
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
      animation: emtPulse 1.4s infinite;
    }
    @keyframes emtPulse {
      0%,100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.3; transform: scale(0.7); }
    }
    #emt-win {
      position: fixed; bottom: 96px; right: 24px;
      width: 340px; max-height: 500px; border-radius: 16px;
      background: #fff; box-shadow: 0 8px 32px rgba(0,0,0,0.14);
      border: 1.5px solid #d1d5db;
      display: flex; flex-direction: column; overflow: hidden;
      z-index: 9998; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      transition: opacity 0.2s, transform 0.2s;
    }
    #emt-win.emt-hide { opacity: 0; pointer-events: none; transform: translateY(10px); }
    #emt-head {
      background: #2563eb; padding: 14px 16px;
      display: flex; align-items: center; gap: 10px; flex-shrink: 0;
    }
    #emt-av {
      width: 36px; height: 36px; border-radius: 50%;
      background: rgba(255,255,255,0.2);
      display: flex; align-items: center; justify-content: center;
      font-size: 15px; font-weight: 600; color: white;
    }
    #emt-head-txt { flex: 1; }
    #emt-head-name { color: white; font-size: 14px; font-weight: 600; }
    #emt-head-status { color: rgba(255,255,255,0.78); font-size: 11px; margin-top: 1px; }
    #emt-x {
      background: none; border: none; color: rgba(255,255,255,0.75);
      font-size: 20px; cursor: pointer; line-height: 1; padding: 2px 4px;
    }
    #emt-x:hover { color: white; }
    #emt-msgs {
      flex: 1; padding: 14px; overflow-y: auto;
      display: flex; flex-direction: column; gap: 8px;
      background: #f5f7fb;
    }
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
    .emt-usr {
      background: #2563eb; color: white;
      border-radius: 14px 4px 14px 14px;
    }
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
    #emt-send:hover { background: #1d4ed8; }
    #emt-send:disabled { opacity: 0.5; cursor: not-allowed; }
    #emt-send svg { width: 17px; height: 17px; fill: white; }
    #emt-foot {
      text-align: center; font-size: 10.5px; color: #9ca3af;
      padding: 5px 0 7px; background: #fff;
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
      LIVE
    </div>
    <button id="emt-btn" aria-label="Open chat">
      <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
      <div id="emt-green-dot"></div>
    </button>
    <div id="emt-win" class="emt-hide">
      <div id="emt-head">
        <div id="emt-av">M</div>
        <div id="emt-head-txt">
          <div id="emt-head-name">eMart IT Assistant</div>
          <div id="emt-head-status">&#9679; Online — replies instantly</div>
        </div>
        <button id="emt-x" aria-label="Close">&#10005;</button>
      </div>
      <div id="emt-msgs">
        <div class="emt-wrap b">
          <div class="emt-msg emt-bot">&#128075; Hi there! How can I help you today?</div>
          <div class="emt-ts">Just now</div>
        </div>
      </div>
      <div id="emt-inp-row">
        <input id="emt-inp" type="text" placeholder="Type a message…" />
        <button id="emt-send" aria-label="Send">
          <svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>
        </button>
      </div>
      <div id="emt-foot">Powered by eMart IT &middot; emartit.com</div>
    </div>
  `;

  var container = document.createElement('div');
  container.innerHTML = HTML;
  document.body.appendChild(container);

  var isOpen = false;

  function getTime() {
    var now = new Date();
    var h = now.getHours(); var m = now.getMinutes();
    var ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return h + ':' + (m < 10 ? '0' + m : m) + ' ' + ap;
  }

  function toggle() {
    isOpen = !isOpen;
    document.getElementById('emt-win').classList.toggle('emt-hide', !isOpen);
    document.getElementById('emt-live-badge').style.display = isOpen ? 'none' : 'flex';
    if (isOpen) document.getElementById('emt-inp').focus();
  }

  function send() {
    var inp = document.getElementById('emt-inp');
    var sendBtn = document.getElementById('emt-send');
    var text = inp.value.trim();
    if (!text) return;
    var msgs = document.getElementById('emt-msgs');

    var uw = document.createElement('div');
    uw.className = 'emt-wrap u';
    uw.innerHTML = '<div class="emt-msg emt-usr">' + text + '</div><div class="emt-ts">' + getTime() + '</div>';
    msgs.appendChild(uw);
    msgs.scrollTop = msgs.scrollHeight;
    inp.value = ''; inp.disabled = true; sendBtn.disabled = true;

    var tw = document.createElement('div');
    tw.className = 'emt-wrap b'; tw.id = 'emt-typing';
    tw.innerHTML = '<div class="emt-typing"><span></span><span></span><span></span></div>';
    msgs.appendChild(tw);
    msgs.scrollTop = msgs.scrollHeight;

    setTimeout(function() {
      var t = document.getElementById('emt-typing');
      if (t) t.remove();
      var bw = document.createElement('div');
      bw.className = 'emt-wrap b';
      bw.innerHTML = '<div class="emt-msg emt-bot">Thanks for your message! AI connects in Phase 2.</div><div class="emt-ts">' + getTime() + '</div>';
      msgs.appendChild(bw);
      msgs.scrollTop = msgs.scrollHeight;
      inp.disabled = false; sendBtn.disabled = false; inp.focus();
    }, 1500);
  }

  document.getElementById('emt-btn').onclick = toggle;
  document.getElementById('emt-x').onclick = toggle;
  document.getElementById('emt-send').onclick = send;
  document.getElementById('emt-inp').onkeydown = function(e) { if (e.key === 'Enter') send(); };

})();
