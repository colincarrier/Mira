import React, { useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import { extensions } from '../utils/tiptap/schema';
import { JSONContent } from '@tiptap/core';
import { Step } from 'prosemirror-transform';
import { TextSelection } from 'prosemirror-state';
import debounce from 'lodash/debounce';
import { queueOp } from '../offline/queueAdapter';
import type { QueueOp } from '@shared/types';
import { Bold, Italic, Heading1 } from 'lucide-react';
import { featureFlags } from '@shared/featureFlags';

interface Props {
  note: { id: string; doc_json: JSONContent };
  onCommit: (doc: JSONContent, steps: Step[]) => void;
  pendingAI: Step[] | null;
}

const SAVE_DEBOUNCE_MS = 3000;

export const NoteEditor: React.FC<Props> = ({ note, onCommit, pendingAI }) => {
  const offline = !navigator.onLine;
  const pendingSteps = useRef<Step[]>([]);
  
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
            tr.insert($from.end(), view.state.schema.nodes.paragraph.create());
            view.dispatch(tr);
            return true;
          }
        }
        
        return false;
      }
    },
    onUpdate: debounce(({ editor, transaction }) => {
      if (!transaction.docChanged) return;
      pendingSteps.current.push(...(transaction.steps as Step[]));
      void saveDoc();
    }, SAVE_DEBOUNCE_MS),
  });

  // Immediate saver used on blur & beforeunload
  const saveDoc = useCallback(async () => {
    if (!pendingSteps.current.length || !editor) return;
    const steps = [...pendingSteps.current];
    pendingSteps.current = [];
    try {
      await Promise.resolve(onCommit(editor.getJSON(), steps));
    } catch (e) {
      console.error("[NoteEditor] failed to save", e);
      // Re-queue steps so they are not lost
      pendingSteps.current.unshift(...steps);
    }
  }, [editor, onCommit]);

  // Queue push when offline
  const debouncedCommit = useCallback(
    (doc: JSONContent, steps: Step[]) => {
      if (offline) {
        const op: QueueOp = {
          id: crypto.randomUUID(),
          type: 'edit',
          noteId: note.id,
          created: Date.now(),
          doc,
          steps: JSON.stringify(steps.map(s => s.toJSON())) as any,
        };
        queueOp(op);
      } else {
        onCommit(doc, steps);
      }
    },
    [offline, note.id, onCommit],
  );

  // Flush on blur
  useEffect(() => {
    if (!editor) return;
    const el = editor.view.dom as HTMLElement;
    el.addEventListener("blur", saveDoc, true);
    return () => el.removeEventListener("blur", saveDoc, true);
  }, [editor, saveDoc]);

  // Flush when navigating away
  useEffect(() => {
    window.addEventListener("beforeunload", saveDoc);
    return () => window.removeEventListener("beforeunload", saveDoc);
  }, [saveDoc]);

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
      {/* Persistent toolbar - only shown when feature flag is on */}
      {featureFlags.SHOW_PERSISTENT_TOOLBAR && (
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
      )}

      {/* iOS-style Bubble menu appears only on selection */}
      <BubbleMenu editor={editor} tippyOptions={{ placement: "top" }}>
        <div className="bubble-menu">
          <button
            data-active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold size={16} />
          </button>
          <button
            data-active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic size={16} />
          </button>
          <button
            data-active={editor.isActive("heading", { level: 1 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            <Heading1 size={16} />
          </button>
        </div>
      </BubbleMenu>
      
      <EditorContent 
        editor={editor} 
        className="w-full"
      />
    </div>
  );
};