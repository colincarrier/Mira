import React, { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { extensions } from '../utils/tiptap/schema';
import { JSONContent } from '@tiptap/core';
import { Step } from 'prosemirror-transform';
import { TextSelection } from 'prosemirror-state';
import { useDebouncedCallback } from 'use-debounce';
import { queueOp } from '../offline/queueAdapter';
import type { QueueOp } from '@shared/types';
import { Bold, Italic, Heading1 } from 'lucide-react';

interface Props {
  note: { id: string; doc_json: JSONContent };
  onCommit: (doc: JSONContent, steps: Step[]) => void;
  pendingAI: Step[] | null;
}

export const NoteEditor: React.FC<Props> = ({ note, onCommit, pendingAI }) => {
  const offline = !navigator.onLine;
  
  const editor = useEditor({
    extensions,
    content: note.doc_json || {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [] },
        { type: 'paragraph', content: [] }
      ]
    },
    autofocus: 'end',
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[500px] p-4'
      },
      handleKeyDown: (view, event) => {
        const { $from } = view.state.selection;
        
        // Handle Enter key at end of title
        if (event.key === 'Enter' && $from.parent.type.name === 'heading' && $from.parent.attrs.level === 1) {
          if ($from.pos === $from.parent.nodeSize - 1) {
            // Create a new paragraph after the title
            const tr = view.state.tr;
            const pos = $from.pos + 1;
            tr.insert(pos, view.state.schema.nodes.paragraph.create());
            const resolvedPos = tr.doc.resolve(pos + 1);
            tr.setSelection(TextSelection.create(tr.doc, resolvedPos.pos));
            view.dispatch(tr);
            return true;
          }
        }
        
        // Handle Backspace at start of paragraph (promote to title)
        if (event.key === 'Backspace' && $from.parent.type.name === 'paragraph' && $from.pos === 1) {
          const nodeBefore = view.state.doc.resolve($from.pos - 1).parent;
          if (nodeBefore.type.name === 'heading' && nodeBefore.attrs.level === 1) {
            // Merge paragraph into heading
            return false;
          }
        }
        
        return false;
      }
    },
    onUpdate: ({ editor, transaction }) => {
      if (!transaction.docChanged) return;
      debouncedCommit(editor.getJSON(), transaction.steps);
    },
  });

  // Queue push when offline
  const debouncedCommit = useDebouncedCallback(
    (doc: JSONContent, steps: Step[]) => {
      if (offline) {
        const op: QueueOp = {
          id: crypto.randomUUID(),
          type: 'edit',
          noteId: note.id,
          created: Date.now(),
          doc,
          steps: JSON.stringify(steps.map(s => s.toJSON())),
        };
        queueOp(op);
      } else {
        onCommit(doc, steps);
      }
    },
    1000,
  );

  // Apply pending AI patch from SSE after blur
  useEffect(() => {
    if (!pendingAI?.length || !editor) return;
    
    // Apply AI content with author mark
    editor.chain()
      .focus('end')
      .command(({ tr }) => {
        // Apply steps and mark as AI authored
        pendingAI.forEach(step => {
          tr.step(step);
        });
        return true;
      })
      .run();
  }, [pendingAI, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="relative">
      {/* Inline toolbar - simplified version without BubbleMenu for now */}
      <div className="sticky top-0 z-10 flex items-center gap-1 p-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
            editor.isActive('bold') ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : ''
          }`}
          title="Bold (⌘B)"
        >
          <Bold size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
            editor.isActive('italic') ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : ''
          }`}
          title="Italic (⌘I)"
        >
          <Italic size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
            editor.isActive('heading', { level: 1 }) ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : ''
          }`}
          title="Heading (⌘⌥1)"
        >
          <Heading1 size={16} />
        </button>
      </div>
      
      <EditorContent 
        editor={editor} 
        className="w-full"
      />
    </div>
  );
};