# SEY GAMERZ GOLDEN ARENA — GOLDEN CLASH

A new black-and-gold real-time multiplayer browser game for two teams of three.

## Included
- Host creates a private room and shares its 6-character room code.
- Six players join on their own phones (3 per team).
- Team captain selection.
- Host dashboard to publish custom questions or the built-in bank questions.
- 30 sets × 10 rounds = 300 rounds in `data/questions.json`.
- Ten rotating battle categories and XP rewards.
- First correct answer wins the round and automatically awards the round XP to that team.
- Incorrect answers earn no XP; opponents can keep trying while the round is live.
- Host reveal, timer, next-round and score reset controls.
- Mobile responsive interface and `/health` endpoint.

## Battle categories / XP
1. Golden Intelligence — 500 XP
2. Golden Puzzle — 1,000 XP
3. Golden Memory — 1,500 XP
4. Golden Strategy — 2,000 XP
5. Golden Jackpot — 3,000 XP
6. Golden Mystery — 1,000 XP
7. Golden Wordplay — 1,500 XP
8. Golden Survival — 2,000 XP
9. Golden Risk — 2,500 XP
10. Golden Final Showdown — 5,000 XP

Each set includes all ten categories; maximum possible score per set is 20,000 XP.

## Run locally
Requires Node.js 20 or newer.

```bash
npm install
npm start
```

Open `http://localhost:3000` on the host computer. To test phones on the same Wi-Fi, use the host computer's LAN IP and port 3000.

## Deploy on GitHub + Render
1. Extract this ZIP.
2. Create a new GitHub repository and upload the project files (not the ZIP itself).
3. In Render, create **New → Web Service** and connect the repository.
4. Build command: `npm install`
5. Start command: `npm start`
6. Deploy. Open the Render URL, create a room, and share its code.
7. Check `https://YOUR-RENDER-URL/health` for `ok: true`.

## Important prototype / tournament notes
- This version uses in-memory room state. If Render restarts or redeploys, active rooms and scores are lost. Do not run a high-stakes tournament until persistent storage is added.
- Host room codes are for casual private rooms, not secure authentication. Anyone with the code can join until the room fills.
- The host must manually start the timer; when it reaches zero, submissions are blocked only if the host has not let the round continue? **Current behavior:** timer reaches zero and displays Time is up, but the answer submission remains enabled until the host reveals or moves on. Host should reveal/advance promptly. (A production version should enforce timer expiry server-side.)
- This is a playable starter package, not yet load-tested for a large event. Test with six devices and a rehearsal room before the live tournament.
- Use the host's **Publish Bank Question** button to load the current set/round question. Or type a custom question and answer.
- If you edit `data/questions.json`, keep the fields `set`, `round`, `category`, `xp`, `question`, `answer`, and `acceptedAnswers`.

## Controls
**Host:** Create room → wait for six players (3 per team) → Start Game → Publish Bank Question or custom question → Start Timer → Reveal Answer → Next Round.

**Players:** Enter room code, name, team → Join → optionally choose captain → submit answer while round is live.
