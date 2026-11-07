import React from "react";
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import Markdown from "../app/components/Markdown";
import {
  joinPages,
  splitPages,
  validSlug,
  searchPattern,
  validateFile,
  validateSignature,
  safeUrl,
  headings,
  looksSensitive,
} from "../app/lib/content";
test("legacy PAGE round trip preserves exact whitespace, empty pages and code", () => {
  for (const source of [
    "",
    " # one\n\n---PAGE---\n\n## two ",
    "---PAGE------PAGE---",
    "```python\nprint(1)\n```",
  ])
    assert.equal(joinPages(splitPages(source)), source);
});
test("page editing preserves other pages and order", () => {
  const source = "first\n---PAGE---\nsecond---PAGE---third";
  const pages = splitPages(source);
  pages[1] = "changed";
  assert.equal(joinPages(pages), "first\n---PAGE---changed---PAGE---third");
  [pages[0], pages[2]] = [pages[2], pages[0]];
  assert.equal(splitPages(joinPages(pages))[0], "third");
});
test("category slugs cannot collide with application routes or traversal", () => {
  for (const slug of [
    "write",
    "writeups",
    "api",
    "../web",
    "web/pwn",
    "_next",
    "a?x=1",
    "",
  ])
    assert.equal(validSlug(slug), false, slug);
  for (const slug of ["web", "c-language", "정보보안"])
    assert.equal(validSlug(slug), true, slug);
});
test("search cannot inject PostgREST filters or wildcard expansion", () => {
  assert.equal(searchPattern("%,title.eq.secret,(x)_"), "%title eq secret  x%");
  assert.equal(searchPattern("sqli"), "%sqli%");
});
test("upload type, extension and size allowlist", () => {
  assert.equal(
    validateFile({ name: "a.png", type: "image/png", size: 20 }),
    null,
  );
  for (const f of [
    { name: "a.svg", type: "image/svg+xml", size: 100 },
    { name: "a.html", type: "image/png", size: 100 },
    { name: "a.pdf", type: "application/pdf", size: 10485761 },
    { name: "a.jpg", type: "image/jpeg", size: 0 },
  ])
    assert.ok(validateFile(f));
});
test("upload signatures reject MIME spoofing", async () => {
  assert.equal(
    await validateSignature(
      new File(["<script>"], "a.png", { type: "image/png" }),
    ),
    false,
  );
  assert.equal(
    await validateSignature(
      new File(["%PDF-1.7"], "a.pdf", { type: "application/pdf" }),
    ),
    true,
  );
});
test("unsafe URLs are denied", () => {
  for (const u of [
    "javascript:alert(1)",
    "data:text/html,x",
    "//evil.test",
    "ftp://host",
    "",
  ])
    assert.equal(safeUrl(u), false);
  assert.equal(safeUrl("https://example.com"), true);
});
test("Markdown blocks executable HTML and unsafe links while preserving GFM", () => {
  const html = renderToStaticMarkup(
    <Markdown
      content={
        "<script>alert(1)</script>\n\n[x](javascript:alert(1))\n\n| A | B |\n| --- | --- |\n| 1 | 2 |\n\n- [x] checked"
      }
    />,
  );
  assert.ok(!html.includes("<script>"));
  assert.ok(!html.includes("javascript:"));
  assert.ok(html.includes("<table>"));
  assert.ok(html.includes('type="checkbox"'));
});
test("spoilers default closed and code keeps language, highlighting, copy", () => {
  const html = renderToStaticMarkup(
    <Markdown
      content={':::spoiler FLAG\nanswer\n:::\n\n```python\nprint("ok")\n```'}
    />,
  );
  assert.ok(html.includes('<details class="spoiler">'));
  assert.ok(!html.includes("<details open"));
  assert.ok(html.includes("language-python"));
  assert.ok(html.includes("hljs"));
  assert.ok(html.includes("코드 복사"));
});
test("headings exclude code fences and support duplicate labels", () => {
  assert.deepEqual(
    headings("## A\n```\n## code\n```\n### A").map((x) => x.id),
    ["section-0", "section-1"],
  );
});
test("all requested code languages render without breaking legacy fenced blocks", () => {
  for (const lang of [
    "python",
    "php",
    "javascript",
    "typescript",
    "c",
    "cpp",
    "bash",
    "sql",
    "html",
    "json",
  ]) {
    const html = renderToStaticMarkup(
      <Markdown content={`\`\`\`${lang}\nvalue = 1;\n\`\`\``} />,
    );
    assert.ok(html.includes(`language-${lang}`), lang);
    assert.ok(html.includes("codeblock"), lang);
  }
});

test("spoiler markers within code fences remain code, including longer fences", () => {
  const html = renderToStaticMarkup(
    <Markdown content={"````text\n:::spoiler FLAG\nanswer\n:::\n```\n````"} />,
  );
  assert.ok(!html.includes("<details"));
  assert.ok(html.includes(":::spoiler"));
});
test("known private key patterns stop local draft persistence checks", () => {
  assert.equal(looksSensitive("-----BEGIN PRIVATE KEY-----"), true);
  assert.equal(looksSensitive("ghp_" + "a".repeat(30)), true);
  assert.equal(looksSensitive("## SQL Injection\nflag{training}"), false);
});
