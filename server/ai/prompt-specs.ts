export const PROMPT = `
SYSTEM: Reply ONLY in this exact JSON. No markdown, no commentary.

{
 "title":      <string>,          // ≤45 chars
 "original":   <string>,          // "" if same as title
 "aiBody":     <string>,          // bullets or paragraph, markdown ok
 "perspective":<string>,          // ≤80 chars why + next prep
 "todos":      <{title:string,priority:"low"|"normal"|"high"}[]>,
 "reminder":   <{timeISO:string,leadMins:number}|null>
}
###
`;
export const buildPrompt = (bio:string, note:string)=>
  PROMPT + `USER_BIO:\n${bio}\nNOTE_TEXT:\n${note}`;
