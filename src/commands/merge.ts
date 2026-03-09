import { cp, mkdir, mkdtemp, rename, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { checkFfmpegInstalled, probeFileDurationSec, runFfmpeg } from '../ffmpeg.ts';
import { getCanonicalAudio, loadManifest } from '../load.ts';

function pushTrimArgs(args: string[], start: number, end: number | null): void {
  if (start > 0) {
    args.push('-ss', String(start));
  }
  if (end !== null) {
    args.push('-to', String(end));
  }
}

export async function run(): Promise<void> {
  const manifest = loadManifest();
  await checkFfmpegInstalled();

  await mkdir(dirname(manifest.output.path), { recursive: true });
  const tempDir = await mkdtemp(join(tmpdir(), 'cohert-'));

  try {
    const processedVideos: string[] = [];
    for (let i = 0; i < manifest.inputs.videos.length; i += 1) {
      const video = manifest.inputs.videos[i];
      const outPath = join(tempDir, `video-${i}.mp4`);
      const args = ['-y', '-i', video.path];
      pushTrimArgs(args, video.trimStartSec, video.trimEndSec);
      args.push('-c:v', 'copy');

      if (video.mute || manifest.sync.muteOriginalVideoAudio) {
        args.push('-an');
      } else {
        args.push('-c:a', 'copy');
      }

      args.push(outPath);
      await runFfmpeg({ args, label: `Step 1 video ${video.id}` });
      processedVideos.push(outPath);
    }

    const processedAudios: string[] = [];
    for (let i = 0; i < manifest.inputs.audios.length; i += 1) {
      const audio = manifest.inputs.audios[i];
      const outPath = join(tempDir, `audio-${i}.wav`);
      const args = ['-y', '-i', audio.path];
      pushTrimArgs(args, audio.trimStartSec, audio.trimEndSec);

      const filters: string[] = [];
      filters.push(`volume=${audio.volume}`);
      if (audio.delayStartSec > 0) {
        const delayMs = Math.round(audio.delayStartSec * 1000);
        filters.push(`adelay=${delayMs}|${delayMs}`);
      }

      args.push('-filter:a', filters.join(','), outPath);
      await runFfmpeg({ args, label: `Step 2 audio ${audio.id}` });
      processedAudios.push(outPath);
    }

    const mixedAudio = join(tempDir, 'audio-mixed.wav');
    if (processedAudios.length === 1) {
      try {
        await rename(processedAudios[0], mixedAudio);
      } catch {
        await cp(processedAudios[0], mixedAudio);
      }
    } else {
      const args = ['-y'];
      for (const audioPath of processedAudios) {
        args.push('-i', audioPath);
      }
      args.push(
        '-filter_complex',
        `amix=inputs=${processedAudios.length}:duration=longest:dropout_transition=0`,
        mixedAudio,
      );
      await runFfmpeg({ args, label: 'Step 3 audio mix' });
    }

    const canonical = getCanonicalAudio(manifest);
    const canonicalDuration = await probeFileDurationSec(canonical.path);
    const videoDuration = await probeFileDurationSec(processedVideos[0]);

    const finalArgs = ['-y'];
    if (manifest.sync.autoFitVideoToAudio && manifest.sync.allowVideoLoop && videoDuration < canonicalDuration) {
      finalArgs.push('-stream_loop', '-1');
    }

    finalArgs.push('-i', processedVideos[0], '-i', mixedAudio);
    finalArgs.push(
      '-c:v',
      manifest.output.videoCodec,
      '-crf',
      String(manifest.output.crf),
      '-preset',
      manifest.output.preset,
      '-c:a',
      manifest.output.audioCodec,
      '-r',
      String(manifest.output.fps),
      '-s',
      `${manifest.output.width}x${manifest.output.height}`,
    );

    if (
      !manifest.sync.autoFitVideoToAudio ||
      (videoDuration < canonicalDuration && !manifest.sync.allowVideoLoop)
    ) {
      finalArgs.push('-shortest');
    }

    finalArgs.push(manifest.output.path);

    await runFfmpeg({ args: finalArgs, label: 'Step 4 final merge' });
    console.log(`✓ Done → ${manifest.output.path}`);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}
