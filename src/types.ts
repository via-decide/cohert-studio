export interface VideoInput {
  id: string;
  path: string;
  trimStartSec: number;
  trimEndSec: number | null;
  volume: number;
  mute: boolean;
}

export interface AudioInput {
  id: string;
  path: string;
  trimStartSec: number;
  trimEndSec: number | null;
  volume: number;
  isCanonical: boolean;
  delayStartSec: number;
}

export interface ProductionManifest {
  version: string;
  studio: { name: string; mode: string };
  production: { id: string; title: string; slug: string; status: string };
  inputs: { videos: VideoInput[]; audios: AudioInput[] };
  sync: {
    mode: string;
    primaryAudioId: string;
    muteOriginalVideoAudio: boolean;
    autoFitVideoToAudio: boolean;
    allowVideoLoop: boolean;
  };
  output: {
    path: string;
    format: string;
    videoCodec: string;
    audioCodec: string;
    fps: number;
    width: number;
    height: number;
    crf: number;
    preset: string;
  };
}
