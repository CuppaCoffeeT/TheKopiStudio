import { useRef, useState } from 'react';
import { Upload, X, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * FileUpload — dropzone + per-file list. States: idle/drag-over/uploading/success/error.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/FormPrimitives.html
 * JSX source: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/src/form/FormPrimitives.jsx
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * Locked: drag-over border + tint uses red-700; success uses green-700; error uses red-700.
 */

export type FileItemState = 'uploading' | 'success' | 'error';

export interface FileUploadItem {
  id: string;
  name: string;
  size: string; // pre-formatted (e.g. "2.4 MB")
  state: FileItemState;
  progress?: number; // 0-100 for uploading
}

interface FileUploadProps {
  files?: FileUploadItem[];
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  error?: boolean;
  hint?: string;
  onFiles?: (files: File[]) => void;
  onRemove?: (id: string) => void;
  className?: string;
  /** Forwarded to the hidden `<input type="file">` for Playwright targeting. */
  inputTestId?: string;
  /**
   * Forwarded to the hidden `<input type="file" capture>` attribute.
   * `"environment"` = rear camera (default for field photos on mobile).
   * `"user"` = front-facing camera. `true` = browser default.
   * When omitted, the attribute is not set — preserves current behavior.
   */
  capture?: boolean | 'user' | 'environment';
}

export function FileUpload({
  files = [],
  accept,
  multiple = true,
  disabled = false,
  error = false,
  hint = 'PDF · DOCX · XLSX · PNG · JPG · max 25MB each',
  onFiles,
  onRemove,
  className,
  inputTestId,
  capture,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const pickFiles = () => !disabled && inputRef.current?.click();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    if (disabled) return;
    const list = Array.from(e.dataTransfer.files);
    if (list.length) onFiles?.(list);
  };

  return (
    <div className={cn('flex flex-col gap-2.5', className)}>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        data-testid={inputTestId}
        {...(capture !== undefined ? { capture } : {})}
        onChange={(e) => {
          const list = e.target.files ? Array.from(e.target.files) : [];
          if (list.length) onFiles?.(list);
          if (inputRef.current) inputRef.current.value = '';
        }}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={pickFiles}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
        className={cn(
          'rounded-[10px] px-5 py-[22px] w-full flex flex-col items-center gap-2 text-center',
          'border-[1.5px] border-dashed transition-[border-color,background-color] duration-150',
          drag
            ? 'border-red-700 dark:border-red-400 bg-red-700/5 dark:bg-red-400/10'
            : error
              ? 'border-red-700 dark:border-red-400'
              : 'border-zinc-300 dark:border-zinc-700',
          !drag && !error && !disabled && 'hover:border-zinc-400 dark:hover:border-zinc-600',
          disabled ? 'bg-zinc-100 dark:bg-zinc-900 opacity-70 cursor-not-allowed' : 'bg-zinc-50/60 dark:bg-zinc-900/40 cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 dark:focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950'
        )}
      >
        <span
          className={cn(
            'w-9 h-9 rounded-lg inline-flex items-center justify-center border',
            'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800',
            drag ? 'text-red-700 dark:text-red-400' : 'text-zinc-500 dark:text-zinc-400'
          )}
        >
          <Upload size={18} />
        </span>
        <div
          className="text-zinc-900 dark:text-zinc-50 font-medium"
          style={{ fontFamily: 'var(--font-sans)', fontSize: 14 }}
        >
          {drag ? 'Drop files to upload' : 'Drop files here, or click to browse'}
        </div>
        <div
          className="text-zinc-500 dark:text-zinc-400"
          style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}
        >
          {hint}
        </div>
      </button>

      {files.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {files.map((f) => (
            <FileRow key={f.id} item={f} onRemove={onRemove} />
          ))}
        </div>
      )}
    </div>
  );
}

function FileRow({ item, onRemove }: { item: FileUploadItem; onRemove?: (id: string) => void }) {
  const ext = (item.name.split('.').pop() || 'FILE').toUpperCase().slice(0, 3);
  return (
    <div
      className={cn(
        'flex items-center gap-2.5 px-3 py-2.5 rounded-lg',
        'bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800'
      )}
    >
      <span
        className={cn(
          'w-7 h-8 rounded-sm inline-flex items-center justify-center flex-shrink-0 font-semibold',
          'bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800',
          'text-zinc-500 dark:text-zinc-400'
        )}
        style={{ fontFamily: 'var(--font-mono)', fontSize: 9 }}
      >
        {ext}
      </span>
      <div className="flex-1 min-w-0">
        <div
          className="truncate font-medium text-zinc-900 dark:text-zinc-50"
          style={{ fontFamily: 'var(--font-sans)', fontSize: 13 }}
        >
          {item.name}
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span
            className="tabular-nums text-zinc-500 dark:text-zinc-400"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}
          >
            {item.size}
          </span>
          {item.state === 'uploading' && (
            <>
              <span className="flex-1 max-w-[180px] h-1 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <span
                  className="block h-full bg-red-700 dark:bg-red-400"
                  style={{ width: `${item.progress ?? 0}%` }}
                />
              </span>
              <span
                className="tabular-nums text-red-700 dark:text-red-400"
                style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}
              >
                {item.progress ?? 0}%
              </span>
            </>
          )}
          {item.state === 'error' && (
            <span
              className="text-red-700 dark:text-red-400"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}
            >
              Upload failed · retry
            </span>
          )}
        </div>
      </div>
      {item.state === 'success' && (
        <span
          className={cn(
            'w-5 h-5 rounded-full inline-flex items-center justify-center flex-shrink-0',
            'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
          )}
        >
          <Check size={12} strokeWidth={2.5} />
        </span>
      )}
      {item.state === 'error' && (
        <span
          className={cn(
            'w-5 h-5 rounded-full inline-flex items-center justify-center flex-shrink-0',
            'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
          )}
        >
          <AlertCircle size={12} strokeWidth={2.5} />
        </span>
      )}
      <button
        type="button"
        onClick={() => onRemove?.(item.id)}
        className={cn(
          'w-6 h-6 rounded-md inline-flex items-center justify-center flex-shrink-0',
          'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 dark:focus-visible:ring-red-400'
        )}
        aria-label="Remove file"
      >
        <X size={11} />
      </button>
    </div>
  );
}
