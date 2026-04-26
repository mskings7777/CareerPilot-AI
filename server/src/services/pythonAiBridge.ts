import path from 'path';
import { spawn } from 'node:child_process';

interface PythonResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const PYTHON_BIN = process.env.PYTHON_BIN || 'python3';
const PYTHON_ENGINE_PATH = path.resolve(__dirname, '../../ai/engine.py');

export const runPythonAiTask = async <T>(
  action: string,
  payload: unknown
): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    const child = spawn(PYTHON_BIN, [PYTHON_ENGINE_PATH, action], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let settled = false;

    const finish = (handler: () => void) => {
      if (settled) return;
      settled = true;
      handler();
    };

    child.stdout.on('data', (chunk: Buffer | string) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      finish(() => reject(error));
    });

    child.on('close', (code) => {
      finish(() => {
        if (code !== 0) {
          reject(
            new Error(
              `Python AI engine exited with code ${code}. ${stderr || stdout || 'No error output.'}`
            )
          );
          return;
        }

        let parsed: PythonResponse<T>;
        try {
          parsed = JSON.parse(stdout) as PythonResponse<T>;
        } catch (error) {
          reject(
            new Error(
              `Python AI engine returned invalid JSON. ${error instanceof Error ? error.message : String(error)}`
            )
          );
          return;
        }

        if (!parsed.success) {
          reject(new Error(parsed.error || 'Python AI engine failed without an error message.'));
          return;
        }

        resolve(parsed.data as T);
      });
    });

    child.stdin.end(JSON.stringify(payload));
  });
};
