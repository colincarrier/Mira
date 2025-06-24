import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { NoteWithTodos } from '@shared/schema';

export default function NoteDetailSimple(){
  const { id } = useParams();
  const [,setLoc] = useLocation();
  const {data:note,isLoading}=useQuery<NoteWithTodos>({queryKey:[`/api/notes/${id}`],enabled:!!id});
  if(isLoading||!note) return null;
  const rc = note.richContext? JSON.parse(note.richContext): {};
  const title= rc.title||note.aiGeneratedTitle||note.content.split('\n')[0]||'Untitled';
  const original= rc.original||(title!==note.content? note.content:'' );
  return(
   <div className="min-h-screen bg-[#f1efe8] pb-20">
     <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center gap-3">
       <button onClick={()=>setLoc('/')} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"><ArrowLeft className="w-4 h-4"/></button>
       <h1 className="text-lg font-semibold">{title}</h1>
     </div>
     <div className="space-y-6 px-4 py-6">
       <h1 className="text-2xl font-semibold">{title}</h1>
       {original && <div className="bg-blue-50 p-4 rounded whitespace-pre-wrap text-sm">{original}</div>}
       {rc.aiBody && <pre className="whitespace-pre-wrap text-base">{rc.aiBody}</pre>}
       {rc.perspective && <p className="text-xs text-gray-500 whitespace-pre-wrap">{rc.perspective}</p>}
     </div>
   </div>);
}
