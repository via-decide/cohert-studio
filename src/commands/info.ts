import { existsSync } from 'node:fs';
import { checkFfmpegInstalled, probeFileDurationSec } from '../ffmpeg.js';
import { getCanonicalAudio, loadManifest } from '../load.js';
import { checkFfmpegInstalled, probeFileDurationSec } from '../ffmpeg.ts';
import { getCanonicalAudio, loadManifest } from '../load.ts';

export async function run(): Promise<void> {
  try {
    const manifest = loadManifest();
    await checkFfmpegInstalled();

    const videoDurations = new Map<string, number>();
    const audioDurations = new Map<string, number>();

    for (const video of manifest.inputs.videos) {
      if (!existsSync(video.path)) {
        console.log(`⚠ skipping missing video: ${video.path}`);
        continue;
      }

      const duration = await probeFileDurationSec(video.path);
      videoDurations.set(video.id, duration);
      console.log(`video ${video.id}: ${duration.toFixed(2)}s (${video.path})`);
    }

    for (const audio of manifest.inputs.audios) {
      if (!existsSync(audio.path)) {
        console.log(`⚠ skipping missing audio: ${audio.path}`);
        continue;
      }

      const duration = await probeFileDurationSec(audio.path);
      audioDurations.set(audio.id, duration);
      console.log(`audio ${audio.id}: ${duration.toFixed(2)}s (${audio.path})`);
    }

    const canonical = getCanonicalAudio(manifest);
    const canonicalDuration = audioDurations.get(canonical.id);
    if (canonicalDuration === undefined) {
      console.log(`canonical audio duration unavailable (file missing): ${canonical.path}`);
    } else {
      console.log(`canonical audio duration: ${canonicalDuration.toFixed(2)}s`);
    }

    let outputDurationMessage = 'unknown';
    if (manifest.sync.mode === 'audio-led') {
      outputDurationMessage =
        canonicalDuration !== undefined
          ? `${canonicalDuration.toFixed(2)}s (from canonical audio)`
          : 'audio-led but canonical file missing';
    } else if (manifest.sync.mode === 'video-led') {
      const firstVideo = manifest.inputs.videos[0];
      const duration = videoDurations.get(firstVideo.id);
      outputDurationMessage =
        duration !== undefined ? `${duration.toFixed(2)}s (from first video)` : 'video-led but first video missing';
    } else if (manifest.sync.mode === 'manual') {
      outputDurationMessage = 'manual mode: set trimEndSec on primary asset';
    }

    console.log(`calculated output duration: ${outputDurationMessage}`);
    console.log(`estimated output path: ${manifest.output.path}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`info failed: ${message}`);
    process.exit(1);
  }
}
