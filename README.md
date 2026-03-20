# Text Mixer App

Expo mini app for the Alter test task. The flow captures a source text, captures a style reference, sends both to Claude through a local proxy, and reveals the rewritten result with connected transitions, mixing animation, voice transcription, and TTS playback.

https://github.com/user-attachments/assets/3a632869-8d5a-4602-bd95-b9b81289e8b2

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy env files:

```bash
cp .env.example .env
cp proxy/.env.example proxy/.env
```

3. Fill in the proxy env values:

- `ANTHROPIC_API_KEY`
- `ELEVENLABS_API_KEY`
- `ELEVENLABS_VOICE_ID`
- optional model overrides if you want to change defaults

4. Start the proxy:

```bash
set -a && source proxy/.env && npm run proxy:start
```

5. Start Expo in a second terminal:

```bash
set -a && source .env && npm run start
```

If you run the app on a physical device, replace `EXPO_PUBLIC_PROXY_URL=http://localhost:8787` with the LAN IP of the machine running the proxy.

## Architecture

- `src/features/text-mixer/model`
  - owns flow state, transitions, voice capture, and TTS playback hooks
- `src/features/text-mixer/services`
  - client adapters for proxy `mix`, `speech-to-text`, and `text-to-speech`
- `proxy/server.mjs`
  - thin backend that protects vendor keys and forwards requests to Claude and ElevenLabs

The client never talks directly to Anthropic or ElevenLabs. All vendor calls go through the local proxy.

## Approach

- Kept the 4-screen structure from the brief and treated motion as the main loading affordance instead of adding a separate progress bar.
- Reframed the feature around the actual product behavior: source text + style reference, not two symmetric texts.
- Added voice input on both capture screens via ElevenLabs STT and a `Listen` action on the result screen via ElevenLabs TTS.
- Preserved the connected screen-to-screen handoff animation and the Reanimated-driven mixing state.

## Tradeoffs

- `react-native-reanimated` stays on v4 instead of downgrading to v3. This is a deliberate choice to keep a newer compatible version rather than matching the brief literally.
- The proxy is intentionally minimal and uses a single local Express server instead of a production deployment target. That keeps the test task runnable without introducing a larger backend framework.
- TTS audio is returned as base64 from the proxy for simplicity. For production, I would likely move this to signed URLs or streaming playback.

## What Was Cut

- No additional mix modes beyond `style-transfer`.
- No explicit progress bar on the mixing screen. The orbital merge animation remains the primary processing cue.
- No persistent transcript history, waveform visualization, or background audio controls.
- No production auth, rate limiting, or deployment config for the proxy.

## Validation

```bash
npm test -- --runInBand
npm run typecheck
```
