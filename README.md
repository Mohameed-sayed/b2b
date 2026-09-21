# 🚀 iSchool B2B Onboarding Interactive Game Platform

A real-time multiplayer workshop game platform engineered for onboarding new **Coding Instructors** joining the **iSchool B2B** team.

Built with a fast **React + TypeScript + Vite + Tailwind CSS** frontend, a **Node.js + Express + Socket.IO** real-time engine, and a file-backed **JSON / SQLite-ready persistence store** (`server/data/`).

---

## 🎯 Key Workshop Modules (All 7 Games + Finale)

1. **Game 1: Urgent or Fake Urgent?** (Prioritization)
   - Multi-request triage with mid-round dynamic reveals ("The presentation is actually due next Thursday!").
2. **Game 2: The Plot Twist** (Adaptability)
   - Sudden classroom pivots (Grade 5 ➔ Grade 3 Scratch ➔ School firewall glitch ➔ Unplugged contingency).
3. **Game 3: Oops! I Did It Again** (Ownership + Mistakes)
   - The Notice ➔ Inform ➔ Fix ➔ Prevent framework. Escalation of systemic recurring breakdowns.
4. **Game 4: WhatsApp Court** (Communication & Professionalism)
   - Real Egyptian conversational workplace messages ("مش هقدر", ghosting, over-explaining vs professional boundary setting).
5. **Game 5: Own It / Support It / Escalate It** (Ownership + Teamwork)
   - Rapid 3-way triage classification.
6. **Game 6: Clarify Before You Commit** (Judgment & Clarification)
   - Identifying missing critical details from vague mentor requests before committing.
7. **Game 7: B2B Escape Room (Team Mode)** (Crisis Management)
   - 45-minute emergency countdown with 5 progressive clue dossiers and collaborative team solving.
8. **Final Reflection: "One Behavior I'll Practice"**
   - Individual commitment pledge wall + celebratory "READY. SET. GO. 🚀" confetti finale.

---

## ⚡ Quick Start

### 1. First-Time Setup

```bash
# Install all dependencies (root + server + client)
npm run setup
```

### 2. Start Everything (One Command)

```bash
npm run dev
```

This launches **both** the backend (port 3001) and frontend (port 5173) simultaneously with colour-coded output using `concurrently`.

**Alternative launchers (Windows):**
- **Double-click `start.bat`** — opens a terminal and starts both servers
- **Right-click `start.ps1` → Run with PowerShell** — same with PowerShell colours

> [!TIP]
> For production: run `npm run build` first, then `npm start` (serves the built frontend with the live backend).

### 3. Open the Facilitator Screen

Navigate to:
```
http://localhost:5173/
```
Click **"Host Workshop"** to create a live room with a 5-character room code (e.g., `B2B7X`).

### 4. How Participants Join

- **Option A (QR Code Scan)**: Mobile participants point their phone cameras at the QR code on the facilitator screen. It directs them to `http://<YOUR_LAN_IP>:5173/join/<CODE>`.
- **Option B (Direct URL / PIN)**: Participants go to `http://<YOUR_LAN_IP>:5173/join` and type the 5-character code.
- No app installation or sign-up required.

> [!NOTE]
> **Browser Refresh / Tab Close**: Participants are automatically rejoined to their active session when they reopen the page. A "Reconnecting…" screen appears while the session is being restored. If the session has expired (> 6 hours), they are redirected to the join form with the room code pre-filled.

---

## 🖥️ Screen Sharing & Facilitation Guide

### Facilitator Interface (Laptop Screen)
- **16:9 Screen-Share Optimized**: High contrast, large legible typography, and large buttons.
- **Controls**:
  - `[START GAME]`: Launches the selected workshop module.
  - `[REVEAL ANSWER]` / `[SHOW RESULTS]`: Reveals live answer distribution bar charts.
  - `[FACILITATOR DEBRIEF]`: Drawer revealing learning objectives, debrief prompts ("Why did you choose C?"), and facilitator discussion starters.
  - `[SHOW LEADERBOARD]`: Podium display with gold/silver/bronze medals, score streaks (🔥), and team standings.
  - `[ADJUST POINTS]`: Manual bonus point modal for verbal participation.
  - Spacebar keyboard shortcut advances the next natural game action.

### Participant Mobile Interface (Phone Screen)
- **Zero Install Web App**: Fast mobile cards tailored to each question:
  - Standard 4-choice cards.
  - Authentic dark-mode WhatsApp chat bubble interface with `👍 Professional` / `👎 Unprofessional` buttons.
  - Triage cards: `🟢 OWN IT`, `🟡 SUPPORT IT`, `🔴 ESCALATE IT`.
  - Sentence input for reflection pledges.

---

## 🛠️ Workshop Content Editor (`/admin`)

Navigate to:
```
http://localhost:5173/admin
```
- Edit any scenario, option, correct answer, timer, points, or debrief notes without touching code.
- Add custom games or export/import question sets as JSON.

---

## 📂 Project Architecture

```
b2b/
├── package.json               # Root workspace scripts
├── plan.md                    # Workshop requirements & curriculum specification
├── server/
│   ├── data/                  # File-based JSON/SQLite persistence
│   │   ├── games.json         # Seeded games & custom questions
│   │   ├── rooms.json         # Active & archived room states
│   │   └── reflections.json   # Participant commitments
│   └── src/
│       ├── data/seedGames.js  # Complete curriculum content
│       ├── storage/db.js      # Storage engine
│       ├── gameEngine.js      # State machine & scoring engine
│       ├── socketHandler.js   # Real-time WebSocket protocol
│       ├── routes/api.js      # REST API & LAN IP auto-detection
│       └── index.js           # Server entrypoint
└── client/
    ├── src/
    │   ├── components/
    │   │   ├── facilitator/   # 16:9 Facilitator screens (Lobby, Question, Reveal, Leaderboard, Escape Room, Reflection)
    │   │   ├── participant/   # Mobile views (Join, Waiting, WhatsApp Court, Triage, Result)
    │   │   └── admin/         # Game content customizer
    │   ├── services/socket.ts # Resilient Socket.IO client manager
    │   ├── utils/audio.ts     # Synthesized Web Audio SFX (fanfares, ticks, gongs)
    │   ├── utils/confetti.ts  # Canvas confetti effects
    │   └── App.tsx            # Universal shell and route manager
    └── vite.config.ts         # Vite configuration with LAN host binding
```

---

## 🔒 Security & Offline Resilience
- Client state is masked on the server: correct answers and explanations are never sent to participants until the host triggers the reveal.
- Server-authoritative scoring: points are calculated server-side based on correctness and remaining time.
- Local storage session persistence ensures participants can refresh their browsers without losing their score or streak.
