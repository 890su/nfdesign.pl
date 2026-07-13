export interface DocumentHeading {
  depth: number;
  text: string;
  id: string;
}

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const plainText = (value: string) =>
  value
    .replace(/!?(\[[^\]]*\])\([^)]*\)/g, "$1")
    .replace(/[*_`]/g, "")
    .trim();

const slugify = (value: string) =>
  plainText(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");

const renderInline = (value: string) => {
  let html = escapeHtml(value);

  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>");
  html = html.replace(/(?<!_)_([^_]+)_(?!_)/g, "<em>$1</em>");
  html = html.replace(
    /\[([^\]]+)\]\(([^\s)]+)(?:\s+&quot;[^&]*&quot;)?\)/g,
    (_match, label, href) => {
      const decodedHref = href.replaceAll("&amp;", "&");
      if (!/^(https?:\/\/|\/|#)/.test(decodedHref)) return label;
      return `<a href="${decodedHref}">${label}</a>`;
    },
  );

  return html;
};

const isTableDivider = (line: string) =>
  /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);

const tableCells = (line: string) =>
  line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((cell) => cell.trim());

export const getDocumentHeadings = (markdown: string): DocumentHeading[] => {
  const ids = new Map<string, number>();

  return markdown.split(/\r?\n/).flatMap((line) => {
    const match = /^(#{1,3})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!match) return [];

    const baseId = slugify(match[2]) || "section";
    const occurrence = ids.get(baseId) ?? 0;
    ids.set(baseId, occurrence + 1);
    return [
      {
        depth: match[1].length,
        text: plainText(match[2]),
        id: occurrence ? `${baseId}-${occurrence + 1}` : baseId,
      },
    ];
  });
};

export const renderMarkdown = (markdown: string) => {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const headings = getDocumentHeadings(markdown);
  const headingIds = [...headings];
  const html: string[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (/^```/.test(line)) {
      const language = line.slice(3).trim();
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !/^```/.test(lines[index]))
        code.push(lines[index++]);
      if (index < lines.length) index += 1;
      html.push(
        `<pre${language ? ` data-language="${escapeHtml(language)}"` : ""}><code>${escapeHtml(code.join("\n"))}</code></pre>`,
      );
      continue;
    }

    const heading = /^(#{1,3})\s+(.+?)\s*#*\s*$/.exec(line);
    if (heading) {
      const item = headingIds.shift();
      const depth = heading[1].length;
      html.push(
        `<h${depth} id="${item?.id ?? slugify(heading[2])}">${renderInline(heading[2])}</h${depth}>`,
      );
      index += 1;
      continue;
    }

    if (/^\s{0,3}([-*_])(?:\s*\1){2,}\s*$/.test(line)) {
      html.push("<hr />");
      index += 1;
      continue;
    }

    if (line.startsWith(">")) {
      const quote: string[] = [];
      while (index < lines.length && lines[index].startsWith(">")) {
        quote.push(lines[index].replace(/^>\s?/, ""));
        index += 1;
      }
      html.push(
        `<blockquote><p>${renderInline(quote.join(" "))}</p></blockquote>`,
      );
      continue;
    }

    if (line.includes("|") && isTableDivider(lines[index + 1] ?? "")) {
      const header = tableCells(line);
      index += 2;
      const rows: string[][] = [];
      while (
        index < lines.length &&
        lines[index].includes("|") &&
        lines[index].trim()
      ) {
        rows.push(tableCells(lines[index]));
        index += 1;
      }
      html.push(
        `<div class="table-wrap"><table><thead><tr>${header.map((cell) => `<th>${renderInline(cell)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${header.map((_, cellIndex) => `<td>${renderInline(row[cellIndex] ?? "")}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`,
      );
      continue;
    }

    const listMatch = /^\s*([-+*]|\d+\.)\s+(.+)$/.exec(line);
    if (listMatch) {
      const ordered = /\d+\./.test(listMatch[1]);
      const items: string[] = [];
      while (index < lines.length) {
        const item = /^\s*([-+*]|\d+\.)\s+(.+)$/.exec(lines[index]);
        if (!item || /\d+\./.test(item[1]) !== ordered) break;
        const checkbox = /^\[([ xX])\]\s+(.+)$/.exec(item[2]);
        items.push(
          checkbox
            ? `<li class="task-item"><input type="checkbox" disabled ${checkbox[1].toLowerCase() === "x" ? "checked" : ""} /><span>${renderInline(checkbox[2])}</span></li>`
            : `<li>${renderInline(item[2])}</li>`,
        );
        index += 1;
      }
      html.push(
        `<${ordered ? "ol" : "ul"}>${items.join("")}</${ordered ? "ol" : "ul"}>`,
      );
      continue;
    }

    const paragraph: string[] = [line.trim()];
    index += 1;
    while (index < lines.length && lines[index].trim()) {
      const next = lines[index];
      if (
        /^(#{1,3})\s|^```|^>|^\s*([-+*]|\d+\.)\s+/.test(next) ||
        (next.includes("|") && isTableDivider(lines[index + 1] ?? ""))
      )
        break;
      paragraph.push(next.trim());
      index += 1;
    }
    html.push(`<p>${renderInline(paragraph.join(" "))}</p>`);
  }

  return html.join("\n");
};
