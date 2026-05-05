# Turkish TV Live Channels App

This project is a starter Electron app for selecting and playing live TV streams. It includes Windows packaging configuration so the app can be built as a `.exe` installer.

## What this app does

- Displays a dropdown of sample Turkish TV channels.
- Plays HLS streams in a built-in window using a browser engine.
- Supports packaging into a Windows executable installer via `electron-builder`.

## Important note

This is a template only. Web browsers and Electron apps cannot directly receive TV broadcast, network signals, or Bluetooth signal sources. The app supports direct HLS/DASH stream URLs, but it cannot generate or discover paid TV Plus channel feeds automatically.

To play a real channel, paste a valid stream URL into the app or add the URL to `channels.json` for a channel entry. The app now loads channel names from `channels.json`, so you can add both TV and radio channels there.

You can also load a local channel file using the built-in file picker, add a channel directly in the app and save it to local storage, and mark channels as favorites.

Favorites are shown with a star in the list, and you can filter to show only favorite channels.

## Setup and build instructions

1. Install Node.js and npm on Windows.
2. Open a command prompt in this folder.
3. Run:

```bash
npm install
```

4. To start the app in development mode:

```bash
npm start
```

5. To build a Windows installer `.exe`:

```bash
npm run dist
```

The built installer will appear in the `dist` folder.

## Legal and streaming notice

Use only authorized Turkish TV streaming sources. This repository does not provide actual licensed channel streams.
