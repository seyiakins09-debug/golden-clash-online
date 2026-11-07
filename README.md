# GOLDEN CLASH — Online Multiplayer v2

This is an updated GitHub + Render version with separate host/player login, answer submission, sequential 10-round sets, 40-second round timer, host answer verification/reveal, and automatic XP award for the selected winner.

## Deploy on Render
1. Upload the contents of this folder to your GitHub repository (replace the old files).
2. In Render, open your existing Web Service and confirm:
   - Runtime: Node
   - Build command: `npm install`
   - Start command: `npm start`
3. Deploy latest commit and open your Render URL.

## Host
- Host Login → enter host name and PIN → Create new room.
- For returning host, enter room code + same PIN and use “Host login to existing room”.
- Share room code with players.
- Start a set. Use **Next round** to open rounds in order.
- Each round is 40 seconds. Players submit answers while it is open.
- Reveal answer, review submitted answers, select the correct player, and award round XP. XP is automatically based on the round's XP value.
- Finish set or reset room.

## Players
- Player Login → enter name and host's room code.
- Submit answers in the visible answer box while round is open.

## Important
- This is a prototype question generator, not the final authored 300-question bank yet. It generates set-specific variants across 30 sets and 10 rounds.
- Room/player/XP data is stored in server memory and is cleared if the service restarts or room is reset. This is intentionally session-only.
- The host PIN is basic prototype authentication. Do not use a valuable password.
