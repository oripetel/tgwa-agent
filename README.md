<div align="center">
  <br />
  <p>
    <img src="https://raw.githubusercontent.com/oripetel/tgwa-agent/main/logo.png" width="360" alt="tgwa-agent logo" />
  </p>
  <h1><code>tgwa-agent</code></h1>
  <p><strong>🎯 Telegram-Controlled WhatsApp Scheduler – Powered by GPT & Whisper</strong></p>
</div>

> [!CAUTION]
> This project **controls your WhatsApp Web session**. Use only with your own account and understand the risks involved.

---

## 💡 About

**`tgwa-agent` is a voice-aware, natural-language WhatsApp scheduling assistant** – fully controlled via Telegram.

- ⌨️ Send commands like: `שלח לאמא מחר ב־8 בבוקר "בוקר טוב!"`
- 🎙️ Send voice messages — Whisper transcribes and interprets them
- 🧠 GPT understands, extracts name + time + message
- ✅ WhatsApp sends at the right moment

<div align="center">
  <p>
    <a href="https://nodejs.org"><img src="https://img.shields.io/badge/Node.js-%3E=18.x-green.svg" alt="Node.js version" /></a>
    <a href="https://openai.com/"><img src="https://img.shields.io/badge/OpenAI-GPT_4%20%26%20Whisper-blue.svg" alt="OpenAI GPT & Whisper" /></a>
    <a href="https://github.com/yourUser/tgwa-agent/actions"><img src="https://github.com/yourUser/tgwa-agent/actions/workflows/test.yml/badge.svg" alt="CI Status" /></a>
  </p>
</div>

---

## 📦 Stack

| Layer            | Library                | Role                                        |
| ---------------- | ---------------------- | ------------------------------------------- |
| WhatsApp Client  | `whatsapp-web.js`      | Sends messages, fetches contacts            |
| Telegram UI      | `node-telegram-bot-api`| User interaction, inline buttons            |
| NLP Engine       | `OpenAI GPT & Whisper` | Interprets commands, transcribes voice      |
| Core Logic       | Custom Node.js         | Routing, queueing, security, orchestration  |

---

## 🚀 Features

- ✅ Natural language message scheduling
- ✅ Voice message interpretation (Whisper)
- ✅ Rich inline button UI in Telegram
- ✅ Message queue view + deletion
- ✅ Secure: responds only to your Telegram ID
- ❌ No GUI — all chat-based (by design)

---

## 📸 Demo

> 🧠 Coming soon – video walkthrough and screen captures

---

## 🧠 Example

```text
👤 You: שלח ליואב ב־17:45 "תביא את המצלמה"
🤖 Bot: אישור. ההודעה תישלח ליואב ב־17:45.
🕓 [at 17:45]
📲 WhatsApp: תביא את המצלמה
````

Voice works too:

```text
🎤 You (voice): תגיד לשילה מחר בבוקר שיביא את המפתח
🤖 Bot: ✅ מבוצע – מתוזמן לשילה ל־08:00 מחר.
```

---

## 🗂 Folder Structure

```
src/
├─ core/          # main engine (TelegramClient, WhatsAppClient, Scheduler)
├─ handlers/      # commands and text interpretation
├─ prompts/       # GPT system prompts
├─ utils/         # helpers: logger, contacts, time, env
└─ data/          # optional persistent queue state (JSON)
```

---

## 🛠 Installation

> \[!NOTE]
> Requires **Node.js 18+**, and a Telegram bot token from [@BotFather](https://t.me/BotFather)

```bash
git clone https://github.com/yourUser/tgwa-agent.git
cd tgwa-agent
npm install
cp .env.example .env  # then fill TELEGRAM_TOKEN, OPENAI_API_KEY, AUTH_USER_ID
npm start
```

---

## 🔐 Environment Variables

```env
TELEGRAM_TOKEN=your-telegram-bot-token
AUTH_USER_ID=your-numeric-telegram-id
OPENAI_API_KEY=sk-...
```

---

## 📜 Commands

| Action        | Example input                    | Effect                      |
| ------------- | -------------------------------- | --------------------------- |
| 📩 Schedule   | `שלח למני עוד שעה "תביא אוכל"`   | GPT extracts + queues       |
| 🗂 View queue | `/queue` or `מה בתור?`           | List all scheduled messages |
| ❌ Delete job  | `תמחק את 2` or tap ❌ on Telegram | Clears timeout              |
| 🔁 Reconnect  | `/start`                         | Shows new WhatsApp QR       |
| ⛔ Disconnect  | `/disconnect`                    | Destroys session            |

---

## 🔐 Security Notes

> \[!IMPORTANT]
> `tgwa-agent` only responds to one Telegram ID defined in `.env` as `AUTH_USER_ID`.

* Tokens are stored securely via `.env`
* `.gitignore` excludes all sensitive/local files
* QR is time-limited — expires after 60s

---

## 📅 Roadmap

* [ ] Multi-user support
* [ ] Persistent DB queue (Mongo/Supabase)
* [ ] Web dashboard for managing messages
* [ ] Forwarding WhatsApp replies to Telegram

---

## 🙋 FAQ

**Q:** Does this violate WhatsApp terms?
**A:** Yes. Like `whatsapp-web.js` itself, this is a headless client — use only with caution and for personal automation.

**Q:** Can it handle more than one user?
**A:** Not yet. You can fork and add user auth via Telegram `chat.id`.

**Q:** Does it support groups?
**A:** Not currently. Only 1:1 messages to contacts.

---

## ❤️ Credits

* [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js)
* [node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api)
* [OpenAI Whisper](https://platform.openai.com/docs/guides/speech-to-text)
* [OpenAI GPT-4o](https://platform.openai.com/docs/models/gpt-4o)

---

## ⭐ Support

If this helped you — consider starring the repo or contributing!

```sh
git clone https://github.com/yourUser/tgwa-agent.git
```

Made with ❤️ by [@PostIT\_1](https://t.me/PostIT_1)
