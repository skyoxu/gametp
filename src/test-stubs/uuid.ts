export function v4(): string {
  const rnd = (n = 16) =>
    Array.from({ length: n }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  const ts = Date.now().toString(16).slice(-8);
  // Simple UUID-like shape xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  return `${rnd(8)}-${rnd(4)}-4${rnd(3)}-a${rnd(3)}-${ts}${rnd(12 - ts.length)}`;
}
