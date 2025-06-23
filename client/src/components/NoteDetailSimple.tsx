import React from 'react';

interface Note {
  richContext?: string;
  aiGeneratedTitle?: string;
  content: string;
}

interface NoteDetailSimpleProps {
  note: Note;
}

export default function NoteDetailSimple({ note }: NoteDetailSimpleProps) {
  const rc = note.richContext ? JSON.parse(note.richContext) : { title: note.aiGeneratedTitle || note.content };
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">{rc.title}</h1>
      {rc.original && <p className="text-gray-700 whitespace-pre-wrap">{rc.original}</p>}
      {rc.aiBody && <pre className="bg-gray-50 p-3 whitespace-pre-wrap text-sm">{rc.aiBody}</pre>}
    </div>
  );
}