import { storage } from '../storage';
import { RichContext } from './compose-v2';
import { detectTimeReferences } from '../brain/miraAIProcessing';

export async function persistSideEffects(rc:RichContext,noteId:number){
  if (rc.aiBody?.startsWith('•')){
    for (const line of rc.aiBody.split('\n')){
      const ttl=line.replace(/^•\s*/,'').trim();
      if(ttl) await storage.createTodo({title:ttl, noteId});
    }
  }
  const {shouldCreateReminder,extractedTimes}=detectTimeReferences(rc.original||"");
  if(shouldCreateReminder && extractedTimes[0]){
    const dt=new Date(); // simple stub; replace with real parse if needed
    await storage.createReminder({title:rc.title, reminderTime:dt, noteId});
  }
}
