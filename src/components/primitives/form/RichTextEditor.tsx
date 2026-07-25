import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, ListOrdered, Link2, HardDrive } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/primitives/overlays/Popover';
import { Input } from '@/components/primitives/form/Input';
import { Field } from '@/components/primitives/form/Field';
import { Button } from '@/components/primitives/shell/Button';
import { cn } from '@/lib/utils';

/**
 * RichTextEditor — TipTap-backed composer surface for email/comment bodies.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-27-Hdx8fN/project/ui_kits/appbase/src/RichTextEditor.jsx
 * Preview: docs/99-refactor/_system/design/handoffs/2026-04-27-Hdx8fN/project/preview/component-rich-text-editor.html
 *
 * Used by SendInvoiceEmailDialog · SendProgressClaimEmailDialog · (future) Email Inbox compose.
 * Supersedes legacy `@/components/ui/rich-text-editor`.
 *
 * Locked:
 *   • Toolbar = bold · italic · bullet · ordered · 1px divider · link · NAS-link popover trigger
 *   • Outer focus ring = --ring brown border + the --shadow-focus brown halo when contentEditable has focus
 *   • Toolbar btn states: default · hover/pressed (--secondary tint) · focus-visible (--ring brown) · disabled
 */

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string | number;
  maxHeight?: string | number;
  disabled?: boolean;
}

const TOOLBAR_BTN_BASE =
  'inline-flex h-7 min-w-[1.75rem] items-center justify-center gap-1 rounded-[5px] px-1.5 text-[12px] leading-none ' +
  'text-muted-foreground transition-colors duration-150 cursor-pointer ' +
  'hover:bg-secondary active:bg-secondary ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ' +
  'disabled:cursor-not-allowed disabled:bg-transparent disabled:text-muted-foreground disabled:hover:bg-transparent';

const TOOLBAR_BTN_ACTIVE =
  'bg-secondary text-foreground';

function ToolbarButton({
  ariaLabel,
  shortcut,
  active,
  disabled,
  onClick,
  children,
}: {
  ariaLabel: string;
  shortcut?: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={active || undefined}
      title={shortcut ? `${ariaLabel} (${shortcut})` : ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className={cn(TOOLBAR_BTN_BASE, active && !disabled && TOOLBAR_BTN_ACTIVE)}
    >
      {children}
    </button>
  );
}

function NasLinkPopoverContent({
  onInsert,
  onClose,
}: {
  onInsert: (link: { url: string; text: string }) => void;
  onClose: () => void;
}) {
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');

  const isValid = (() => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  })();

  const handleInsert = () => {
    if (!isValid) return;
    onInsert({ url, text: text.trim() || 'View files on NAS' });
    setUrl('');
    setText('');
    onClose();
  };

  return (
    <div className="flex w-72 flex-col gap-3 p-1">
      <div className="text-[12px] font-medium text-foreground">Insert NAS link</div>
      <Field label="URL">
        <Input
          autoFocus
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="\\\\nas01\\quotations\\..."
          onKeyDown={(e) => {
            if (e.key === 'Enter' && isValid) {
              e.preventDefault();
              handleInsert();
            }
          }}
        />
      </Field>
      <Field label="Display text" hint="Optional · defaults to 'View files on NAS'">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="View files on NAS"
        />
      </Field>
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" variant="primary" size="sm" disabled={!isValid} onClick={handleInsert}>
          Insert
        </Button>
      </div>
    </div>
  );
}

function Toolbar({ editor, disabled }: { editor: Editor; disabled?: boolean }) {
  const [nasOpen, setNasOpen] = useState(false);

  const handleInsertLink = () => {
    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('URL', previousUrl || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const handleInsertNas = (link: { url: string; text: string }) => {
    editor
      .chain()
      .focus()
      .insertContent(
        `<a href="${link.url}" target="_blank" rel="noopener noreferrer">${link.text}</a>`,
      )
      .run();
  };

  return (
    <div
      className={cn(
        'flex items-center gap-0.5 border-b border-border bg-secondary px-2 py-1.5',
      )}
    >
      <ToolbarButton
        ariaLabel="Bold"
        shortcut="⌘B"
        active={editor.isActive('bold')}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        ariaLabel="Italic"
        shortcut="⌘I"
        active={editor.isActive('italic')}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        ariaLabel="Bullet list"
        shortcut="⌘⇧8"
        active={editor.isActive('bulletList')}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        ariaLabel="Ordered list"
        shortcut="⌘⇧7"
        active={editor.isActive('orderedList')}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-3.5 w-3.5" />
      </ToolbarButton>

      <span aria-hidden className="mx-1 h-4 w-px self-center bg-border" />

      <ToolbarButton
        ariaLabel="Insert link"
        shortcut="⌘K"
        active={editor.isActive('link')}
        disabled={disabled}
        onClick={handleInsertLink}
      >
        <Link2 className="h-3.5 w-3.5" />
      </ToolbarButton>

      <Popover open={nasOpen} onOpenChange={setNasOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Insert NAS link"
            aria-expanded={nasOpen || undefined}
            disabled={disabled}
            className={cn(
              TOOLBAR_BTN_BASE,
              'gap-1.5 px-2 text-[11.5px] font-medium',
              nasOpen && !disabled && TOOLBAR_BTN_ACTIVE,
            )}
          >
            <HardDrive className="h-3.5 w-3.5" />
            <span>NAS link</span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-auto p-3">
          <NasLinkPopoverContent onInsert={handleInsertNas} onClose={() => setNasOpen(false)} />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Start typing…',
  className,
  minHeight = 140,
  maxHeight,
  disabled = false,
}: RichTextEditorProps) {
  const [hasFocus, setHasFocus] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: false }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    editable: !disabled,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    onFocus: () => setHasFocus(true),
    onBlur: () => setHasFocus(false),
  });

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (!editor) return;
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const currentHtml = editor.getHTML();
    if (content && content !== currentHtml && content !== '<p></p>') {
      editor.commands.setContent(content, false);
    }
  }, [content, editor]);

  useEffect(() => {
    if (!editor) return;
    if (editor.isEditable === !disabled) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  if (!editor) return null;

  const minHeightCss = typeof minHeight === 'number' ? `${minHeight}px` : minHeight;
  const maxHeightCss = typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight;

  return (
    <div
      data-state={disabled ? 'disabled' : hasFocus ? 'focused' : 'default'}
      className={cn(
        'w-full min-w-0 overflow-hidden rounded-lg border bg-card transition-[box-shadow,border-color] duration-150',
        'border-border',
        hasFocus && !disabled && 'border-ring shadow-[var(--shadow-focus)]',
        disabled && 'pointer-events-none opacity-55',
        className,
      )}
    >
      <Toolbar editor={editor} disabled={disabled} />
      <EditorContent
        editor={editor}
        style={{ minHeight: minHeightCss, maxHeight: maxHeightCss }}
        className={cn(
          'prose prose-sm max-w-none w-full overflow-y-auto px-3.5 py-3 text-foreground',
          '[&_.tiptap]:outline-none [&_.tiptap]:break-words [&_.tiptap]:min-h-[inherit]',
          '[&_.tiptap_p]:my-0 [&_.tiptap_p]:mb-2.5 [&_.tiptap_p:last-child]:mb-0',
          '[&_.tiptap_strong]:font-semibold',
          '[&_.tiptap_em]:italic [&_.tiptap_em]:text-muted-foreground',
          '[&_.tiptap_a]:text-[color:var(--brand-red)] [&_.tiptap_a]:underline [&_.tiptap_a]:underline-offset-2 [&_.tiptap_a]:decoration-1 hover:[&_.tiptap_a]:decoration-2',
          '[&_.tiptap_ul]:list-disc [&_.tiptap_ol]:list-decimal',
          '[&_.tiptap_ul]:pl-[22px] [&_.tiptap_ol]:pl-[22px] [&_.tiptap_ul]:mb-2.5 [&_.tiptap_ol]:mb-2.5',
          '[&_.tiptap_li]:my-0.5',
          '[&_.tiptap_p.is-editor-empty:first-child]:before:text-muted-foreground',
          '[&_.tiptap_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]',
          '[&_.tiptap_p.is-editor-empty:first-child]:before:float-left',
          '[&_.tiptap_p.is-editor-empty:first-child]:before:h-0',
          '[&_.tiptap_p.is-editor-empty:first-child]:before:pointer-events-none',
        )}
      />
    </div>
  );
}
