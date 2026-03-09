import { mkdir } from 'node:fs/promises';
import { runFfmpeg } from '../ffmpeg.js';
import { loadManifest } from '../load.js';

export async function run(): Promise<void> {
  const manifest = loadManifest();
  await mkdir('./renders', { recursive: true });

  for (const video of manifest.inputs.videos) {
    if (video.trimStartSec <= 0 && video.trimEndSec === null) {
      continue;
    }

    const outPath = `./renders/trim-${video.id}.mp4`;
    const args = ['-y', '-i', video.path, '-ss', String(video.trimStartSec)];
    if (video.trimEndSec !== null) {
      args.push('-to', String(video.trimEndSec));
    }
    args.push('-c', 'copy', outPath);
    await runFfmpeg({ args, label: `trim video ${video.id}` });
    console.log(`trimmed video: ${outPath}`);
  }

  for (const audio of manifest.inputs.audios) {
    if (audio.trimStartSec <= 0 && audio.trimEndSec === null) {
      continue;
    }

    const outPath = `./renders/trim-${audio.id}.wav`;
    const args = ['-y', '-i', audio.path, '-ss', String(audio.trimStartSec)];
    if (audio.trimEndSec !== null) {
      args.push('-to', String(audio.trimEndSec));
    }
    args.push('-c', 'copy', outPath);
    await runFfmpeg({ args, label: `trim audio ${audio.id}` });
    console.log(`trimmed audio: ${outPath}`);
  }
}
