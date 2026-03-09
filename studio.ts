#!/usr/bin/env node

const command = process.argv[2];

switch (command) {
  case 'validate':
    await import('./src/commands/validate.js').then((m) => m.run());
    break;
  case 'info':
    await import('./src/commands/info.js').then((m) => m.run());
    break;
  case 'dry':
    await import('./src/commands/dry.js').then((m) => m.run());
    break;
  case 'merge':
    await import('./src/commands/merge.js').then((m) => m.run());
    break;
  case 'trim':
    await import('./src/commands/trim.js').then((m) => m.run());
    await import('./src/commands/validate.ts').then((m) => m.run());
    break;
  case 'info':
    await import('./src/commands/info.ts').then((m) => m.run());
    break;
  case 'dry':
    await import('./src/commands/dry.ts').then((m) => m.run());
    break;
  case 'merge':
    await import('./src/commands/merge.ts').then((m) => m.run());
    break;
  case 'trim':
    await import('./src/commands/trim.ts').then((m) => m.run());
    break;
  default:
    console.log(`
cohert-studio — audio-video merge tool

Commands:
  npm run validate    Validate production.json and check input files exist
  npm run info        Show durations and output plan (requires ffprobe)
  npm run dry         Print full ffmpeg merge plan without running it
  npm run merge       Run the full merge → renders/
  npm run trim        Export trimmed clips only (no merge)

Edit production.json to configure inputs, sync, and output settings.
Drop video files in assets/video/ and audio files in assets/audio/
`);
    process.exit(1);
}
