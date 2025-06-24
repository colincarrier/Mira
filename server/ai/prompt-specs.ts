export const PROMPT = `
SYSTEM: Reply ONLY in this exact JSON. No markdown, no commentary.

{
 "title":      <string>,
 "original":   <string>,
 "aiBody":     <string>,
 "perspective":<string>,
 "todos":      <{title:string,priority:"low"|"normal"|"high"}[]>,
 "reminder":   <{timeISO:string,leadMins:number}|null>
}
###
`;
export const buildPrompt = (bio, note) =>
  PROMPT + "USER_BIO:\n" + bio + "\nNOTE_TEXT:\n" + note;
