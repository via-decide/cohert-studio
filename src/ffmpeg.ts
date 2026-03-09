import { spawn } from 'node:child_process';

export interface FfmpegJob {
  args: string[];
  label: string;
}

export function runFfmpeg(job: FfmpegJob): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', job.args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';

    proc.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(text);
    });

    proc.on('error', (error) => {
      reject(new Error(`${job.label} failed to start: ${error.message}`));
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${job.label} failed with code ${code ?? 'unknown'}\n${stderr}`));
    });
  });
}

export function checkFfmpegInstalled(): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', ['-version'], { stdio: 'ignore' });

    proc.on('error', () => {
      reject(new Error('ffmpeg not found. Install it: https://ffmpeg.org/download.html'));
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error('ffmpeg not found. Install it: https://ffmpeg.org/download.html'));
      }
    });
  });
}

export function probeFileDurationSec(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const args = [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'default=noprint_wrappers=1:nokey=1',
      filePath,
    ];

    const proc = spawn('ffprobe', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    proc.on('error', (error) => {
      reject(new Error(`ffprobe failed to start: ${error.message}`));
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`ffprobe failed for ${filePath}: ${stderr}`));
        return;
      }

      const duration = Number.parseFloat(stdout.trim());
      if (!Number.isFinite(duration)) {
        reject(new Error(`Could not parse duration for ${filePath}. Output: ${stdout}`));
        return;
      }

      resolve(duration);
    });
  });
}
