import { test } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { searchPosts, summaries } from "../app/lib/queries";
function client(reply: (url: URL) => Response) {
  return createClient("https://example.invalid", "test-public-key", {
    global: { fetch: async (input) => reply(new URL(String(input))) },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
test("archive queries DB search, stable order, pagination, category and metadata filters without fetching bodies", async () => {
  let observed: URL | undefined;
  const db = client((url) => {
    observed = url;
    return new Response(JSON.stringify([{ id: 1, title: "SQL" }]), {
      headers: {
        "content-type": "application/json",
        "content-range": "12-12/13",
      },
    });
  });
  const result = await searchPosts(
    {
      q: "sqli",
      page: 2,
      category: "web",
      platform: "Dreamhack",
      difficulty: "Easy",
      sort: "updated",
    },
    db,
  );
  assert.equal(result.count, 13);
  assert.equal(result.posts[0].id, 1);
  const p = observed!.searchParams;
  assert.ok(!p.get("select")!.split(",").includes("content"));
  assert.equal(p.get("category"), "eq.web");
  assert.equal(p.get("offset"), "12");
  assert.equal(p.get("limit"), "12");
  assert.ok(p.get("or")!.includes("content.ilike.%sqli%"));
  assert.ok(p.get("order")!.startsWith("updated_at.desc"));
});
test("legacy schema fallback does not discard original records", async () => {
  let calls = 0;
  const db = client((url) => {
    calls++;
    if (url.searchParams.get("select")!.includes("updated_at"))
      return new Response(
        JSON.stringify({ code: "42703", message: "column missing" }),
        { status: 400 },
      );
    return new Response(
      JSON.stringify([
        { id: 5, title: "Old", category: "web", created_at: "2026-01-01" },
      ]),
      {
        headers: {
          "content-type": "application/json",
          "content-range": "0-0/1",
        },
      },
    );
  });
  const result = await searchPosts({ page: 1, sort: "updated" }, db);
  assert.equal(calls, 2);
  assert.equal(result.posts[0].title, "Old");
  const rows = await summaries(db);
  assert.equal(rows[0].id, 5);
});
test("permission/network failures do not masquerade as empty archives", async () => {
  const db = client(
    () =>
      new Response(JSON.stringify({ code: "42501", message: "denied" }), {
        status: 403,
      }),
  );
  await assert.rejects(searchPosts({ page: 1 }, db));
  await assert.rejects(summaries(db));
});
