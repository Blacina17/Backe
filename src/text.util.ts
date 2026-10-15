import type { Pool, RowDataPacket } from 'mysql2/promise';

/** Colapsa espacios y recorta. */
export function clean(text: string): string {
  return text.normalize('NFC').replace(/\s+/g, ' ').trim();
}

/** "méxico  city" -> "México City". */
export function titleCase(text: string): string {
  return clean(text)
    .toLowerCase()
    .replace(/(^|\s)(\p{L})/gu, (_m, space: string, ch: string) => space + ch.toUpperCase());
}

/** Sin acentos, mayúsculas ni símbolos: "Compra en línea" -> "compraenlinea". */
export function simplify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export function levenshtein(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length];
}

/** Igual o casi igual ("banco" ~ "Bancos", "phising" ~ "Phishing"). */
export function isSimilar(a: string, b: string): boolean {
  const x = simplify(a);
  const y = simplify(b);
  if (!x || !y) return false;
  if (x === y) return true;
  const longest = Math.max(x.length, y.length);
  if (longest < 4) return false;
  return levenshtein(x, y) <= Math.max(1, Math.floor(longest * 0.2));
}

/** Reutiliza la escritura de un país ya registrado ("Mexico" ~ "México"). */
export async function resolveCountry(pool: Pool, raw: string): Promise<string> {
  const value = titleCase(raw);
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT pais, COUNT(*) AS total FROM usuario
     WHERE pais IS NOT NULL GROUP BY pais ORDER BY total DESC`,
  );
  const match = rows.find((row) => isSimilar(String(row.pais), value));
  return match ? String(match.pais) : value;
}