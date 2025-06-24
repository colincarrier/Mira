import { RecursiveAnalysis } from '../intelligence-v2/recursive-reasoning-engine';

export interface RichContext {
  title:string; original?:string; aiBody?:string; perspective?:string;
  todos?:{title:string,priority:"low"|"normal"|"high"}[];
  reminder?:{timeISO:string,leadMins:number}|null;
}

export function composeFromAnalysis(raw:string,a:RecursiveAnalysis|null):RichContext{
  const clean = raw.trim().replace(/\s+/g,' ');
  const title = clean.length<=45 ? clean : clean.slice(0,42)+'…';
  const original = title===clean? "" : raw;

  let bullets:string[] = [];
  if (a?.proactiveDelivery?.suggestedActions){
     bullets = a.proactiveDelivery.suggestedActions
       .filter(x=>!/^Research /i.test(x.action))
       .slice(0,3)
       .map(x=>'• '+x.action);
  }
  if (bullets.length===0 && a?.recursiveReasoning?.step1Anticipation?.likelyNextNeeds){
     bullets.push('• '+a.recursiveReasoning.step1Anticipation.likelyNextNeeds[0]);
  }

  const aiBody = bullets.join('\n');
  const p1 = a?.immediateProcessing?.understanding?.slice(0,80) || '';
  const p2 = a?.recursiveReasoning?.step1Anticipation?.followUpQuestions?.[0] || '';
  const perspective = [p1,p2].filter(Boolean).join('  ');

  return { title, original, aiBody, perspective, todos:[], reminder:null };
}
