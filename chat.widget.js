(async () => {
  // === Read bot ID from script tag ===
  const botId = document.currentScript.getAttribute("data-bot-id");
  if (!botId) return console.error("? Bot ID missing in script tag");

  // === Supabase Config ===
  const SUPABASE_URL = "https://mbpxofmifsnfiqplhjnr.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1icHhvZm1pZnNuZmlxcGxoam5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNjg1NjcsImV4cCI6MjA3Nzc0NDU2N30.h4UsQ43dFscidn-UqsGXsuMqQdZGccLK95DcIHN11IM";

  // === Fetch bot data ===
  let bot;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/bots?id=eq.${botId}`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });
    [bot] = await res.json();
  } catch (e) {
    console.error("? Failed to fetch bot data", e);
  }

  if (!bot) return console.error("? Bot not found for ID:", botId);

  // === Inject Styles ===
  const style = document.createElement("style");
  style.textContent = `
    .cw-btn {
      position: fixed; bottom: 20px; right: 20px;
      background: ${bot.color || "#0066ff"};
      color: #fff; border-radius: 50%;
      width: 60px; height: 60px;
      display: flex; align-items: center; justify-content: center;
      font-size: 26px; cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transition: all .25s ease; z-index: 9999;
    }
    .cw-btn:hover { transform: scale(1.1); }
    .cw-window {
      position: fixed; bottom: 100px; right: 20px;
      width: 360px; max-height: 520px;
      background: #fff; border-radius: 16px;
      display: flex; flex-direction: column;
      box-shadow: 0 6px 24px rgba(0,0,0,0.15);
      overflow: hidden; transform: translateY(20px);
      opacity: 0; transition: all .3s ease;
      z-index: 9999;
    }
    .cw-window.open { transform: translateY(0); opacity: 1; }
    .cw-header {
      background: ${bot.color || "#0066ff"};
      color: white; padding: 12px 14px;
      font-weight: 600; display: flex;
      justify-content: space-between; align-items: center;
    }
    .cw-body {
      flex: 1; padding: 12px;
      background: #f7f8fa; overflow-y: auto;
      display: flex; flex-direction: column; gap: 8px;
    }
    .cw-msg {
      max-width: 80%; padding: 10px 14px;
      border-radius: 14px; font-size: 14px;
      line-height: 1.4; word-wrap: break-word;
      animation: fadeIn .25s ease;
    }
    .cw-msg.user { align-self: flex-end; background: ${bot.color || "#0066ff"}; color: #fff; border-bottom-right-radius: 4px; }
    .cw-msg.bot { align-self: flex-start; background: #e4e6eb; color: #000; border-bottom-left-radius: 4px; }
    .cw-input { display: flex; border-top: 1px solid #ddd; }
    .cw-input input {
      flex: 1; border: none; padding: 10px;
      outline: none; font-size: 14px;
    }
    .cw-input button {
      background: ${bot.color || "#0066ff"}; color: #fff;
      border: none; padding: 0 16px; cursor: pointer;
      font-weight: 500; transition: opacity .2s;
    }
    .cw-input button:hover { opacity: 0.8; }
    @keyframes fadeIn { from {opacity:0;} to {opacity:1;} }
  `;
  document.head.appendChild(style);

  // === Create Elements ===
  const btn = document.createElement("div");
  btn.className = "cw-btn";
  btn.innerHTML = "??";
  document.body.appendChild(btn);

  const chat = document.createElement("div");
  chat.className = "cw-window";
  chat.innerHTML = `
    <div class="cw-header">
      <span>${bot.name}</span>
      <span style="cursor:pointer;">?</span>
    </div>
    <div class="cw-body" id="cw-body"></div>
    <div class="cw-input">
      <input id="cw-input" type="text" placeholder="Type your message..." />
      <button id="cw-send">Send</button>
    </div>`;
  document.body.appendChild(chat);

  const body = chat.querySelector("#cw-body");
  const input = chat.querySelector("#cw-input");
  const send = chat.querySelector("#cw-send");
  const close = chat.querySelector(".cw-header span:last-child");

  const addMsg = (text, from) => {
    const msg = document.createElement("div");
    msg.className = `cw-msg ${from}`;
    msg.textContent = text;
    body.appendChild(msg);
    body.scrollTop = body.scrollHeight;
  };

  addMsg(bot.welcome_message || "?? Hi! How can I help you?", "bot");

  btn.onclick = () => chat.classList.toggle("open");
  close.onclick = () => chat.classList.remove("open");

  const sendMsg = async () => {
    const text = input.value.trim();
    if (!text) return;
    addMsg(text, "user");
    input.value = "";
    try {
      const res = await fetch(bot.webhook_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bot_id: bot.id, message: text }),
      });
      const data = await res.json();
      if (data.reply) addMsg(data.reply, "bot");
      else addMsg("?? No response received", "bot");
    } catch {
      addMsg("?? Server unreachable", "bot");
    }
  };

  send.onclick = sendMsg;
  input.addEventListener("keypress", (e) => e.key === "Enter" && sendMsg());
})();
