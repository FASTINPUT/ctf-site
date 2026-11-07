"use client";
import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import { validSlug } from "@/app/lib/content";
import { useApp, AdminGate } from "./Provider";
import { Button, Card, Input, Toast, ConfirmButton, EmptyState } from "./ui";
function Body({ create = false }: { create?: boolean }) {
  const { categories, reload } = useApp();
  const [name, setName] = useState(""),
    [slug, setSlug] = useState(""),
    [editing, setEditing] = useState<number | null>(null),
    [editName, setEditName] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!name.trim() || !validSlug(slug)) {
      setMessage(
        "이름과 유효한 slug를 입력하세요. slug는 문자·숫자·하이픈을 사용하며 기존 경로와 겹칠 수 없습니다.",
      );
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase
        .from("categories")
        .insert({ name: name.trim(), slug });
      if (error) throw error;
      setMessage("카테고리를 추가했습니다.");
      setName("");
      setSlug("");
      await reload();
    } catch (e) {
      setMessage(`추가 실패: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }
  async function update(id: number) {
    if (!editName.trim() || busy) return;
    setBusy(true);
    try {
      const { error } = await supabase
        .from("categories")
        .update({ name: editName.trim() })
        .eq("id", id)
        .select("id")
        .single();
      if (error) throw error;
      setEditing(null);
      setMessage("이름을 수정했습니다. 기존 URL은 유지됩니다.");
      await reload();
    } catch (e) {
      setMessage(`수정 실패: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }
  async function remove(id: number, slug: string) {
    const { count, error } = await supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("category", slug);
    if (error) {
      setMessage("게시글 연결을 확인하지 못해 삭제하지 않았습니다.");
      return;
    }
    if (count) {
      setMessage(
        `${count}개 글이 연결되어 있습니다. 글의 카테고리를 먼저 변경하세요.`,
      );
      return;
    }
    const { error: err } = await supabase
      .from("categories")
      .delete()
      .eq("id", id)
      .select("id")
      .single();
    if (err) {
      setMessage(`삭제 실패: ${err.message}`);
      return;
    }
    setMessage("빈 카테고리를 삭제했습니다.");
    await reload();
  }
  return (
    <main>
      <div className="page-heading">
        <div>
          <span className="eyebrow">WORKSPACE / CATEGORIES</span>
          <h1>{create ? "카테고리 추가" : "카테고리 관리"}</h1>
          <p>
            표시 이름을 바꿔도 기존 글의 URL은 유지됩니다. 글이 연결된 분류는
            삭제할 수 없습니다.
          </p>
        </div>
        <Link
          className="button"
          href={create ? "/manage-categories" : "/add-category"}
        >
          {create ? "관리로 이동" : "＋ 카테고리 추가"}
        </Link>
      </div>
      <Toast message={message} />
      {create ? (
        <Card>
          <form
            onSubmit={add}
            style={{ display: "grid", gap: 20, maxWidth: 600 }}
          >
            <label>
              이름
              <Input
                required
                value={name}
                maxLength={80}
                onChange={(e) => {
                  setName(e.target.value);
                  setSlug(
                    e.target.value.toLowerCase().trim().replace(/\s+/g, "-"),
                  );
                }}
                placeholder="예: Web"
              />
            </label>
            <label>
              URL slug
              <Input
                required
                value={slug}
                maxLength={80}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="web"
              />
            </label>
            <Button variant="primary" disabled={busy}>
              {busy ? "추가 중…" : "추가하기"}
            </Button>
          </form>
        </Card>
      ) : categories.length ? (
        <div className="post-list">
          {categories.map((c) => (
            <div className="post-row" key={c.id}>
              <div className="post-body">
                {editing === c.id ? (
                  <label>
                    카테고리 이름
                    <Input
                      value={editName}
                      maxLength={80}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  </label>
                ) : (
                  <h3>{c.name}</h3>
                )}
                <small>/{c.slug} · URL 유지</small>
              </div>
              <div className="actions">
                {editing === c.id ? (
                  <>
                    <Button disabled={busy} onClick={() => void update(c.id)}>
                      저장
                    </Button>
                    <Button onClick={() => setEditing(null)}>취소</Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => {
                        setEditing(c.id);
                        setEditName(c.name);
                      }}
                    >
                      수정
                    </Button>
                    <ConfirmButton
                      message={`“${c.name}” 분류를 삭제할까요? 연결된 글이 있으면 삭제를 차단합니다.`}
                      onConfirm={() => remove(c.id, c.slug)}
                    >
                      삭제
                    </ConfirmButton>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </main>
  );
}
export default function CategoryAdmin(props: { create?: boolean }) {
  return (
    <AdminGate>
      <Body {...props} />
    </AdminGate>
  );
}
