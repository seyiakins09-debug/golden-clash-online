# Golden Clash Online — GitHub + Render

## Deploy
1. Create a GitHub repository `golden-clash-online`.
2. Upload all files in this project to the repository root.
3. In Render choose **New → Web Service**, connect the GitHub repo.
4. Runtime: **Node**; Build command: `npm install`; Start command: `npm start`; Health check: `/healthz`.
5. Deploy and open the provided `https://...onrender.com` URL on host and player devices.

## Local run
Install Node.js, run `npm install`, then `npm start`; open http://localhost:10000.

## Prototype notes
This uses Socket.IO for live shared room updates. Rooms and XP live in server memory only and are deleted when host resets; a server restart/redeploy also clears active sessions. The embedded question bank has 3 sample sets and repeats them modulo 3; it is not yet the complete 30-set content bank. Host PIN is a simple prototype PIN, not production-grade account security. Do not use a valuable PIN.
Render supports WebSockets. Free services may spin down after inactivity, causing reconnect/warm-up delays.
