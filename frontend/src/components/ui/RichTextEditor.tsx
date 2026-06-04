import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write here...',
  className = '',
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-purple-400 hover:text-purple-300 underline',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Keep editor content in sync with external value edits
  React.useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className={`border border-white/10 rounded-lg overflow-hidden bg-black/40 focus-within:border-purple-500/50 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all ${className}`}>
      {/* Menu Bar */}
      <div className="flex gap-1 p-2 bg-zinc-950/60 border-b border-white/5 text-xs select-none">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2.5 py-1 rounded hover:bg-white/5 transition-all text-slate-300 font-bold ${
            editor.isActive('bold') ? 'bg-purple-500/20 text-purple-400' : ''
          }`}
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2.5 py-1 rounded hover:bg-white/5 transition-all text-slate-300 italic ${
            editor.isActive('italic') ? 'bg-purple-500/20 text-purple-400' : ''
          }`}
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-2 py-1 rounded hover:bg-white/5 transition-all text-slate-300 ${
            editor.isActive('bulletList') ? 'bg-purple-500/20 text-purple-400' : ''
          }`}
        >
          List
        </button>
        <button
          type="button"
          onClick={() => {
            const url = window.prompt('Enter Link URL:');
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            } else if (url === '') {
              editor.chain().focus().unsetLink().run();
            }
          }}
          className={`px-2 py-1 rounded hover:bg-white/5 transition-all text-slate-300 ${
            editor.isActive('link') ? 'bg-purple-500/20 text-purple-400' : ''
          }`}
        >
          Link
        </button>
      </div>

      {/* Editor Content Area */}
      <EditorContent
        editor={editor}
        className="px-4 py-3 text-white text-sm focus:outline-none min-h-[80px]"
      />
      <style>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #6b7280;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror {
          outline: none;
        }
        .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1.5rem;
        }
        .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
        }
      `}</style>
    </div>
  );
};
