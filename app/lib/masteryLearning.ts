// A corrected answer shows progress; it is not independent evidence of mastery.
export type CheckRecord = { firstChoice: number; latestChoice: number; submissions: number };
export function recordCheck(previous: CheckRecord | undefined, choice: number): CheckRecord {
  return { firstChoice: previous?.firstChoice ?? choice, latestChoice: choice, submissions: (previous?.submissions ?? 0) + 1 };
}
export function checkComplete(record: CheckRecord | undefined, answerIndex: number | undefined): boolean {
  return Boolean(record && answerIndex !== undefined && record.latestChoice === answerIndex);
}
export function summarizeChecks(items: {id:string;answerIndex?:number}[], records: Record<string,CheckRecord>) {
  return { total: items.length, attempted: items.filter(q=>records[q.id]).length,
    firstTry: items.filter(q=>records[q.id]?.firstChoice === q.answerIndex && q.answerIndex !== undefined).length,
    corrected: items.filter(q=>checkComplete(records[q.id],q.answerIndex) && records[q.id].firstChoice !== q.answerIndex).length };
}
