// Wraps occurrences of attention-graph node labels in a plain-text body with
// <span class="atk" data-attention-id="..."> so the global attention-graph
// script can pick them up for hover linkage.

import { attentionNodes } from "../data/attention-graph";

type Lang = "en" | "zh";

interface MatchEntry {
  start: number;
  end: number;
  id: string;
  text: string;
}

const HTML_ESCAPE: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => HTML_ESCAPE[c] ?? c);
}

function buildDict(lang: Lang): Array<{ label: string; id: string }> {
  const entries: Array<{ label: string; id: string }> = [];
  const seen = new Set<string>();
  for (const n of attentionNodes) {
    const primary = lang === "zh" ? n.labelZh : n.labelEn;
    if (!seen.has(primary)) {
      entries.push({ label: primary, id: n.id });
      seen.add(primary);
    }
    for (const a of n.aliases ?? []) {
      if (!seen.has(a)) {
        entries.push({ label: a, id: n.id });
        seen.add(a);
      }
    }
  }
  // Longest label first so e.g. "AI Product Associate" wins over a hypothetical "AI".
  entries.sort((a, b) => b.label.length - a.label.length);
  return entries;
}

const dictCache = new Map<Lang, Array<{ label: string; id: string }>>();

function getDict(lang: Lang) {
  let d = dictCache.get(lang);
  if (!d) {
    d = buildDict(lang);
    dictCache.set(lang, d);
  }
  return d;
}

const isLatinAlnum = (c: string) => /^[A-Za-z0-9]$/.test(c);
const isLatinEdge = (label: string) =>
  /^[A-Za-z]/.test(label[0] ?? "") || /[A-Za-z0-9]$/.test(label[label.length - 1] ?? "");

function findKeywordMatches(text: string, lang: Lang): MatchEntry[] {
  const dict = getDict(lang);
  const textLower = text.toLowerCase();
  const matches: MatchEntry[] = [];

  for (const { label, id } of dict) {
    const labelLower = label.toLowerCase();
    let from = 0;
    while (from <= text.length - label.length) {
      const idx = textLower.indexOf(labelLower, from);
      if (idx < 0) break;

      if (isLatinEdge(label)) {
        const before = idx > 0 ? text[idx - 1] : "";
        const after = idx + label.length < text.length ? text[idx + label.length] : "";
        if ((before && isLatinAlnum(before)) || (after && isLatinAlnum(after))) {
          from = idx + 1;
          continue;
        }
      }

      matches.push({
        start: idx,
        end: idx + label.length,
        id,
        text: text.slice(idx, idx + label.length),
      });
      from = idx + label.length;
    }
  }

  matches.sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start));

  const kept: MatchEntry[] = [];
  let lastEnd = -1;
  for (const m of matches) {
    if (m.start < lastEnd) continue;
    kept.push(m);
    lastEnd = m.end;
  }
  return kept;
}

/** Backwards-compat: wrap only curated keywords, leave the rest as plain text. */
export function markupKeywords(text: string, lang: Lang): string {
  if (!text) return "";
  const kept = findKeywordMatches(text, lang);
  let out = "";
  let cursor = 0;
  for (const m of kept) {
    if (m.start > cursor) out += escapeHtml(text.slice(cursor, m.start));
    out += `<span class="atk atk--kw" data-attention-id="${m.id}">${escapeHtml(m.text)}</span>`;
    cursor = m.end;
  }
  if (cursor < text.length) out += escapeHtml(text.slice(cursor));
  return out;
}

// Sequential tokenization regex — matches one CJK character, one English word,
// or a single letter. Punctuation and whitespace fall through as raw text.
const SEQ_TOKEN_RE = /[一-鿿]|[A-Za-z][A-Za-z0-9'\-]*[A-Za-z0-9]|[A-Za-z]/g;

/**
 * Tokenize body text: every keyword gets its semantic attention-id; every
 * non-keyword word/CJK char gets a sequential attention-id `seq-{pid}-{idx}`.
 * Adjacent seq tokens (window 2) are linked at runtime by attention-graph.ts.
 */
export function tokenizeContent(text: string, lang: Lang, paragraphId: string): string {
  if (!text) return "";
  const keptKw = findKeywordMatches(text, lang);

  let seqIdx = 0;
  const emitSeq = (segment: string): string => {
    if (!segment) return "";
    let out = "";
    let cursor = 0;
    SEQ_TOKEN_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = SEQ_TOKEN_RE.exec(segment)) !== null) {
      if (m.index > cursor) out += escapeHtml(segment.slice(cursor, m.index));
      seqIdx += 1;
      const id = `seq-${paragraphId}-${seqIdx}`;
      out += `<span class="atk atk--seq" data-attention-id="${id}">${escapeHtml(m[0])}</span>`;
      cursor = m.index + m[0].length;
    }
    if (cursor < segment.length) out += escapeHtml(segment.slice(cursor));
    return out;
  };

  let out = "";
  let cursor = 0;
  for (const m of keptKw) {
    if (m.start > cursor) out += emitSeq(text.slice(cursor, m.start));
    out += `<span class="atk atk--kw" data-attention-id="${m.id}">${escapeHtml(m.text)}</span>`;
    cursor = m.end;
  }
  if (cursor < text.length) out += emitSeq(text.slice(cursor));

  return out;
}
