export function detectCategory(text: string): string {
  const clean = text.toLowerCase();
  if (/(meeting|zoom|call|standup|interview)/.test(clean)) return 'meeting';
  if (/(flight|airport|departure|gate)/.test(clean))        return 'flight';
  if (/(doctor|dentist|appointment|checkup)/.test(clean))   return 'appointment';
  if (/(train|uber|taxi|drive)/.test(clean))                return 'travel';
  return 'general';
}