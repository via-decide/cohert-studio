import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { AudioInput, ProductionManifest } from './types.js';

export function loadManifest(manifestPath = './production.json'): ProductionManifest {
  const resolvedManifestPath = resolve(manifestPath);
  const raw = readFileSync(resolvedManifestPath, 'utf8');
  const parsed = JSON.parse(raw) as ProductionManifest;
  const manifestDir = dirname(resolvedManifestPath);
import { resolve } from 'node:path';
import type { AudioInput, ProductionManifest } from './types.ts';

export function loadManifest(manifestPath = './production.json'): ProductionManifest {
  const raw = readFileSync(manifestPath, 'utf8');
  const parsed = JSON.parse(raw) as ProductionManifest;

  if (parsed.studio?.mode !== 'audio-video-composer') {
    throw new Error("Invalid studio.mode. Expected 'audio-video-composer'.");
  }

  if (!Array.isArray(parsed.inputs?.videos) || parsed.inputs.videos.length === 0) {
    throw new Error('Invalid inputs.videos. Expected a non-empty array.');
  }

  if (!Array.isArray(parsed.inputs?.audios) || parsed.inputs.audios.length === 0) {
    throw new Error('Invalid inputs.audios. Expected a non-empty array.');
  }

  const canonicalCount = parsed.inputs.audios.filter((audio) => audio.isCanonical).length;
  if (canonicalCount === 0) {
    throw new Error('Canonical audio is required. Set exactly one audio entry with isCanonical: true.');
  }

  if (canonicalCount > 1) {
    throw new Error(`Expected exactly one canonical audio, found ${canonicalCount}.`);
  }

  const hasPrimary = parsed.inputs.audios.some((audio) => audio.id === parsed.sync?.primaryAudioId);
  if (!hasPrimary) {
    throw new Error(`sync.primaryAudioId '${parsed.sync?.primaryAudioId}' does not match any audio input id.`);
  }

  for (const video of parsed.inputs.videos) {
    if (!existsSync(resolve(manifestDir, video.path))) {
    if (!existsSync(resolve(video.path))) {
      console.warn(`Missing video file: ${video.path}`);
    }
  }

  for (const audio of parsed.inputs.audios) {
    if (!existsSync(resolve(manifestDir, audio.path))) {
    if (!existsSync(resolve(audio.path))) {
      console.warn(`Missing audio file: ${audio.path}`);
    }
  }

  return parsed;
}

export function getCanonicalAudio(manifest: ProductionManifest): AudioInput {
  const canonical = manifest.inputs.audios.filter((audio) => audio.isCanonical);
  if (canonical.length !== 1) {
    throw new Error(`Expected exactly one canonical audio, found ${canonical.length}.`);
  }

  return canonical[0];
}
