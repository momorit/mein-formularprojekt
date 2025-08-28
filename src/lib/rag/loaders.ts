import fs from "fs/promises";
import path from "path";
import pdf from "pdf-parse";
import { unified } from "unified";
import remarkParse from "remark-parse";

export type Doc = { id: string; text: string; source: string };

export async function loadKB(dir: string): Promise<Doc[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const docs: Doc[] = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      docs.push(...await loadKB(full));
    } else if (e.isFile()) {
      const ext = path.extname(e.name).toLowerCase();
      if (ext === ".pdf") {
        const buf = await fs.readFile(full);
        const data = await pdf(buf);
        docs.push({ id: full, text: data.text, source: full });
      } else if (ext === ".md" || ext === ".txt") {
        const raw = await fs.readFile(full, "utf8");
        // (optional) Markdown nach Text parsen:
        const file = await unified().use(remarkParse).parse(raw);
        // Für kurz: nimm raw, oder transformiere file -> Plaintext
        docs.push({ id: full, text: raw, source: full });
      }
    }
  }
  return docs;
}
