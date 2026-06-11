import * as tus from 'tus-js-client';
import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://mymzcbalyqqgdmzsfmam.supabase.co';
const TUS_ENDPOINT = `${SUPABASE_URL}/storage/v1/upload/resumable`;

interface ResumableUploadOptions {
  onProgress?: (bytesUploaded: number, bytesTotal: number) => void;
  cacheControl?: string;
  upsert?: boolean;
  /**
   * No-progress watchdog. If the upload makes NO byte progress for this long,
   * abort + reject (instead of hanging forever on a half-open connection — the
   * TUS retry only fires on a real error, not on a stuck-but-not-errored socket).
   * The timer resets on every onProgress tick, so a slow-but-moving upload never
   * trips it. Default 90s. Pass 0 to disable.
   */
  stallTimeoutMs?: number;
  /** Abort the upload when this signal fires (e.g. the user closes the modal). */
  signal?: AbortSignal;
}

// Workaround for TUS reporting onSuccess() on the last-chunk PATCH ack while
// the server-side finalize that materializes storage.objects fails silently.
// Caused 54 supervisor uploads to be abandoned 2026-05-21 → 2026-05-24 with
// "Failed to create signed URL: Object not found" downstream.
async function verifyObjectExists(bucket: string, path: string): Promise<void> {
  const slash = path.lastIndexOf('/');
  const folder = slash >= 0 ? path.slice(0, slash) : '';
  const filename = slash >= 0 ? path.slice(slash + 1) : path;
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(folder, { search: filename, limit: 1 });
  if (error) {
    throw new Error(`Upload verification failed: ${error.message}`);
  }
  const found = (data ?? []).some((o) => o.name === filename);
  if (!found) {
    throw new Error(
      `Upload reported success but object missing in storage — please retry (${bucket}/${path})`
    );
  }
}

/**
 * Upload a file to Supabase Storage using the TUS resumable upload protocol.
 * Uploads in 6MB chunks with automatic retry and resume on failure.
 * Recommended for files >6MB, especially on mobile connections.
 */
export function resumableUpload(
  bucketName: string,
  storagePath: string,
  file: File | Blob,
  options?: ResumableUploadOptions
): Promise<void> {
  return new Promise((resolve, reject) => {
    const stallMs = options?.stallTimeoutMs ?? 90_000;
    let settled = false;
    let stallTimer: ReturnType<typeof setTimeout> | undefined;
    let onAbort: (() => void) | undefined;

    const clearStall = () => {
      if (stallTimer) clearTimeout(stallTimer);
      stallTimer = undefined;
    };
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearStall();
      if (onAbort && options?.signal) options.signal.removeEventListener('abort', onAbort);
      fn();
    };

    // The tus upload reports completion/failure via callbacks, so the Promise
    // must outlive this executor. The async setup runs in a separate function
    // whose rejection is forwarded with .catch(reject).
    const run = async (): Promise<void> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        finish(() => reject(new Error('No active session — user must be logged in to upload')));
        return;
      }

      const upload = new tus.Upload(file, {
        endpoint: TUS_ENDPOINT,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        headers: {
          authorization: `Bearer ${session.access_token}`,
          'x-upsert': String(options?.upsert ?? false),
        },
        uploadDataDuringCreation: true,
        removeFingerprintOnSuccess: true,
        chunkSize: 6 * 1024 * 1024, // 6MB — required by Supabase
        metadata: {
          bucketName,
          objectName: storagePath,
          contentType: file.type || 'application/octet-stream',
          cacheControl: options?.cacheControl ?? '3600',
        },
        onError(error) {
          finish(() => reject(new Error(`Storage upload failed: ${error.message}`)));
        },
        onProgress(bytesUploaded, bytesTotal) {
          armStall(); // reset the no-progress watchdog on every tick
          options?.onProgress?.(bytesUploaded, bytesTotal);
        },
        onSuccess() {
          clearStall();
          verifyObjectExists(bucketName, storagePath)
            .then(() => finish(resolve))
            .catch((e) => finish(() => reject(e)));
        },
      });

      // No-progress watchdog: abort + reject if the upload sits with zero byte
      // progress for stallMs (a stuck half-open socket never errors, so TUS's
      // retry never fires — without this the caller's Submit/Save button hangs
      // disabled forever). Resets on every onProgress tick.
      function armStall() {
        if (stallMs <= 0) return;
        clearStall();
        stallTimer = setTimeout(() => {
          try { upload.abort(); } catch { /* already torn down */ }
          finish(() => reject(new Error(
            `Upload stalled — no progress for ${Math.round(stallMs / 1000)}s. Check your connection and try again.`,
          )));
        }, stallMs);
      }

      if (options?.signal) {
        if (options.signal.aborted) {
          finish(() => reject(new Error('Upload cancelled')));
          return;
        }
        onAbort = () => {
          try { upload.abort(); } catch { /* already torn down */ }
          finish(() => reject(new Error('Upload cancelled')));
        };
        options.signal.addEventListener('abort', onAbort, { once: true });
      }

      // Resume previous upload if interrupted
      const previousUploads = await upload.findPreviousUploads();
      if (previousUploads.length > 0) {
        upload.resumeFromPreviousUpload(previousUploads[0]);
      }

      upload.start();
      armStall(); // start the watchdog; first onProgress will reset it
    };

    run().catch((error) => {
      finish(() => reject(error instanceof Error ? error : new Error(String(error))));
    });
  });
}
