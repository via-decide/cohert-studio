import { existsSync } from 'node:fs';
import { getCanonicalAudio, loadManifest } from '../load.ts';

export async function run(): Promise<void> {
  try {
    const manifest = loadManifest();
    const canonical = getCanonicalAudio(manifest);

    console.log('✓ version:', manifest.version);
    console.log('✓ studio.mode:', manifest.studio.mode);
    console.log(
      `✓ production: ${manifest.production.id} / ${manifest.production.title} / ${manifest.production.status}`,
    );
    console.log(
      `✓ inputs: ${manifest.inputs.videos.length} video(s), ${manifest.inputs.audios.length} audio(s)`,
    );
    console.log(`✓ canonical audio: ${canonical.id} → ${canonical.path}`);
    console.log(`✓ sync mode: ${manifest.sync.mode}`);
    console.log(
      `✓ output: ${manifest.output.path} / ${manifest.output.videoCodec}+${manifest.output.audioCodec} / ${manifest.output.width}x${manifest.output.height}`,
    );

    let missingCount = 0;

    for (const video of manifest.inputs.videos) {
      if (existsSync(video.path)) {
        console.log(`✓ found video: ${video.path}`);
      } else {
        missingCount += 1;
        console.log(`✗ MISSING video: ${video.path}`);
      }
    }

    for (const audio of manifest.inputs.audios) {
      if (existsSync(audio.path)) {
        console.log(`✓ found audio: ${audio.path}`);
      } else {
        missingCount += 1;
        console.log(`✗ MISSING audio: ${audio.path}`);
      }
    }

    if (missingCount > 0) {
      console.warn(`Validation completed with warnings: ${missingCount} missing input file(s).`);
    } else {
      console.log('Validation successful. All inputs are present.');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`✗ Validation failed: ${message}`);
    process.exit(1);
  }
}
