export function plural(count: number, word: string): string {
  const form = count === 1 ? word : `${word}s`;
  return `${count} ${form}`;
}
