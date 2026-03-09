import { getCanonicalAudio, loadManifest } from '../load.js';

export async function run(): Promise<void> {
  const manifest = loadManifest();
  const canonical = getCanonicalAudio(manifest);
  const video = manifest.inputs.videos[0];

  const tempVideo = '/tmp/cohert-video-silent.mp4';
  const tempAudio = '/tmp/cohert-audio-mixed.wav';

  const stripArgs = [
    '-i',
    video.path,
    '-c:v',
    'copy',
    '-an',
    tempVideo,
  ];

  const adelayMs = Math.max(0, Math.round(canonical.delayStartSec * 1000));
  const mixArgs = [
    '-i',
    canonical.path,
    '-filter:a',
    `volume=${canonical.volume},adelay=${adelayMs}|${adelayMs}`,
    tempAudio,
  ];

  const mergeArgs = [
    '-i',
    tempVideo,
    '-i',
    tempAudio,
    '-c:v',
    'copy',
    '-c:a',
    manifest.output.audioCodec,
    '-shortest',
    manifest.output.path,
  ];

  console.log('── DRY RUN ─────────────────────────────────────');
  console.log(`  Production:   ${manifest.production.title} (${manifest.production.id})`);
  console.log(`  Canonical:    ${canonical.id} → ${canonical.path}`);
  console.log(`  Sync mode:    ${manifest.sync.mode}`);
  console.log(`  Mute video:   ${manifest.sync.muteOriginalVideoAudio}`);
  console.log('');
  console.log('  Step 1  Strip audio from video');
  console.log(`          IN:  ${video.path}`);
  console.log(`          OUT: ${tempVideo}`);
  console.log(`          CMD: ffmpeg ${stripArgs.join(' ')}`);
  console.log('');
  console.log('  Step 2  Mix audio track');
  console.log(`          IN:  ${canonical.path}  (canonical, vol ${canonical.volume}, delay ${canonical.delayStartSec}s)`);
  console.log(`          OUT: ${tempAudio}`);
  console.log(`          CMD: ffmpeg ${mixArgs.join(' ')}`);
  console.log('');
  console.log('  Step 3  Merge video + audio');
  console.log(`          IN:  ${tempVideo} + ${tempAudio}`);
  console.log(`          OUT: ${manifest.output.path}`);
  console.log(`          CMD: ffmpeg ${mergeArgs.join(' ')}`);
  console.log('');
  console.log(`  Output:       ${manifest.output.path}`);
  console.log(`  Codec:        ${manifest.output.videoCodec} / ${manifest.output.audioCodec}`);
  console.log(
    `  Resolution:   ${manifest.output.width}x${manifest.output.height} @ ${manifest.output.fps}fps  crf=${manifest.output.crf}  preset=${manifest.output.preset}`,
  );
  console.log('────────────────────────────────────────────────');
  console.log('Dry run complete. No files written.');
}
