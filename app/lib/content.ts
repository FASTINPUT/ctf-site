export const PAGE_BREAK = "---PAGE---";
export function splitPages(content: string) {
  return content.split(PAGE_BREAK);
}
export function joinPages(pages: string[]) {
  return pages.join(PAGE_BREAK);
}
export function date(value?: string | null) {
  return value
    ? new Date(value).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })
    : "—";
}
export const reservedSlugs = new Set([
  "write",
  "writeups",
  "categories",
  "login",
  "logout",
  "edit",
  "add-category",
  "manage-categories",
  "stats",
  "bookmarks",
  "about",
  "api",
  "_next",
]);
export function validSlug(slug: string) {
  return (
    /^[\p{L}\p{N}][\p{L}\p{N}-]{0,79}$/u.test(slug) && !reservedSlugs.has(slug)
  );
}
export function safeUrl(url?: string) {
  return !!url && /^(https?:\/\/|\/(?!\/)|#)/i.test(url);
}
export function searchPattern(query: string) {
  return `%${query.replace(/[\\%_,().]/g, " ").trim()}%`;
}
export const allowedFiles: Record<string, string[]> = {
  "image/png": ["png"],
  "image/jpeg": ["jpg", "jpeg"],
  "image/webp": ["webp"],
  "image/gif": ["gif"],
  "application/pdf": ["pdf"],
};
export function validateFile(file: {
  name: string;
  type: string;
  size: number;
}) {
  if (
    !allowedFiles[file.type]?.includes(
      file.name.split(".").pop()?.toLowerCase() || "",
    )
  )
    return "PNG, JPG, WebP, GIF, PDF만 업로드할 수 있습니다.";
  if (file.size > 10 * 1024 * 1024 || file.size === 0)
    return "파일은 0바이트 초과, 10MB 이하여야 합니다.";
  return null;
}
export async function validateSignature(file: File) {
  const b = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const signature =
    file.type === "image/png"
      ? b[0] === 137 && b[1] === 80 && b[2] === 78 && b[3] === 71
      : file.type === "image/jpeg"
        ? b[0] === 255 && b[1] === 216 && b[2] === 255
        : file.type === "image/gif"
          ? String.fromCharCode(...b.slice(0, 6)).match(/^GIF8[79]a$/)
          : file.type === "image/webp"
            ? String.fromCharCode(...b.slice(0, 4)) === "RIFF" &&
              String.fromCharCode(...b.slice(8, 12)) === "WEBP"
            : String.fromCharCode(...b.slice(0, 5)) === "%PDF-";
  return Boolean(signature);
}
export const template = (category = "") =>
  `# 문제 정보\n\n- 플랫폼:\n- 문제명:\n- 카테고리: ${category}\n- 난이도:\n- 문제 URL:\n\n# 문제 분석\n\n## 초기 분석\n\n## ${/pwn/i.test(category) ? "메모리 구조와 보호 기법" : /forensic/i.test(category) ? "증거 수집과 무결성 확인" : /web/i.test(category) ? "HTTP 요청과 응답 분석" : "취약점 또는 핵심 원리"}\n\n# 풀이 과정\n\n## 1. 정보 수집\n\n## 2. 취약점 분석\n\n## 3. 실습 및 검증\n\n# 결과\n\n:::spoiler FLAG / 정답\n정답을 여기에 기록하세요.\n:::\n\n# 배운 점\n\n# 참고 자료\n`;
export function headings(markdown: string) {
  let fenced = false;
  let fence = "";
  const result: { level: number; title: string; id: string }[] = [];
  for (const line of markdown.split("\n")) {
    const f = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (f) {
      if (!fenced) {
        fenced = true;
        fence = f[1][0];
      } else if (f[1][0] === fence) fenced = false;
      continue;
    }
    if (fenced) continue;
    const m = line.match(/^(#{2,3})\s+(.+?)\s*#*$/);
    if (m)
      result.push({
        level: m[1].length,
        title: m[2].replace(/[*`_]/g, ""),
        id: `section-${result.length}`,
      });
  }
  return result;
}
export function downloadMarkdown(title: string, content: string) {
  const url = URL.createObjectURL(
    new Blob([content], { type: "text/markdown;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.replace(/[^\p{L}\p{N} _-]/gu, "").slice(0, 90) || "writeup"}.md`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
// Best-effort draft safeguard, not a general secret scanner. Credentials should never be pasted into a writeup.
export function looksSensitive(text: string) {
  return /-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----|\bsb_secret_[A-Za-z0-9_-]{12,}|\b(?:ghp_|github_pat_)[A-Za-z0-9_]{20,}|\bAKIA[A-Z0-9]{16}\b/.test(
    text,
  );
}
