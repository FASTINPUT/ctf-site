"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp } from "./Provider";
import { Card, EmptyState, Skeleton, Toast, Button, Select } from "./ui";
import PostRow from "./PostRow";
import Drafts from "./Drafts";
import { categoryIcon } from "./Shell";
import { summaries } from "@/app/lib/queries";
import type { PostSummary } from "@/app/lib/types";
import { date } from "@/app/lib/content";
export default function Dashboard({
  categoriesOnly = false,
}: {
  categoriesOnly?: boolean;
}) {
  const { categories, admin } = useApp(),
    [posts, setPosts] = useState<PostSummary[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [sort, setSort] = useState("name"),
    [now, setNow] = useState(0);
  async function load() {
    setNow(Date.now());
    setLoading(true);
    try {
      setPosts(await summaries());
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, []);
  const recent = [...posts].sort(
    (a, b) =>
      new Date(b.updated_at || b.created_at).getTime() -
      new Date(a.updated_at || a.created_at).getTime(),
  );
  const count30 = posts.filter(
    (p) =>
      now - new Date(p.created_at).getTime() >= 0 &&
      now - new Date(p.created_at).getTime() <= 30 * 86400000,
  ).length;
  const sorted = [...categories].sort((a, b) =>
    sort === "newest"
      ? new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime()
      : sort === "oldest"
        ? new Date(a.created_at || 0).getTime() -
          new Date(b.created_at || 0).getTime()
        : sort === "desc"
          ? b.name.localeCompare(a.name)
          : a.name.localeCompare(b.name),
  );
  return (
    <main>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            {categoriesOnly
              ? "EXPLORE / CATEGORIES"
              : "PERSONAL SECURITY RESEARCH"}
          </span>
          <h1>{categoriesOnly ? "카테고리" : "CTF Writeups"}</h1>
          <p>
            문제를 풀고, 원리를 이해하고, 배운 것을 기록합니다.
            <br />
            CTF 문제 풀이와 보안 학습을 연결하는 FASTINPUT 아카이브.
          </p>
        </div>
        <div className="actions">
          <Link className="button" href="/writeups">
            전체 글 탐색 ↗
          </Link>
          {admin && (
            <Link className="button primary" href="/write">
              ＋ 새 글 작성
            </Link>
          )}
        </div>
      </div>
      <Toast message={error} />
      {admin && <Drafts />}
      {error && <Button onClick={() => void load()}>다시 불러오기</Button>}
      {loading ? (
        <Skeleton />
      ) : (
        <>
          {!categoriesOnly && (
            <div className="stats-grid">
              {[
                [
                  "Total Writeups",
                  error ? "—" : posts.length,
                  "전체 공개 기록",
                ],
                ["Categories", categories.length, "탐색할 학습 분야"],
                ["최근 30일", error ? "—" : count30, "새롭게 작성한 글"],
                [
                  "최근 업데이트",
                  error
                    ? "—"
                    : date(recent[0]?.updated_at || recent[0]?.created_at),
                  "기록을 이어가는 중",
                ],
              ].map(([label, value, hint]) => (
                <Card key={String(label)}>
                  <div className="stat-label">
                    {label}
                    <span aria-hidden>↗</span>
                  </div>
                  <div
                    className="stat-value"
                    style={
                      label === "최근 업데이트" ? { fontSize: 20 } : undefined
                    }
                  >
                    {value}
                  </div>
                  <div className="stat-hint">{hint}</div>
                </Card>
              ))}
            </div>
          )}
          <div className="section-title">
            <h2>
              분야별 아카이브 <small> / {categories.length}</small>
            </h2>
            <Select
              aria-label="카테고리 정렬"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              style={{ width: "auto" }}
            >
              <option value="name">이름순</option>
              <option value="desc">이름 역순</option>
              <option value="newest">최신순</option>
              <option value="oldest">오래된순</option>
            </Select>
          </div>
          {categories.length ? (
            <div className="category-grid">
              {sorted.map((c) => {
                const list = recent.filter((p) => p.category === c.slug),
                  last = list[0];
                return (
                  <Link
                    className="category-card"
                    key={c.id}
                    href={`/${encodeURIComponent(c.slug)}`}
                  >
                    <div className="category-top">
                      <span className="category-icon" aria-hidden>
                        {categoryIcon(c.slug)}
                      </span>
                      <small>{error ? "—" : list.length} writeups ↗</small>
                    </div>
                    <h3>{c.name}</h3>
                    <p>{last?.title || "첫 번째 기록을 기다리고 있습니다"}</p>
                    <small>{date(last?.updated_at || last?.created_at)}</small>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState title="등록된 카테고리가 없습니다" />
          )}
          {!categoriesOnly && (
            <div className="dashboard-columns">
              <section>
                <div className="section-title">
                  <h2>최근 Writeups</h2>
                  <Link href="/writeups">모든 기록 보기 →</Link>
                </div>
                {recent.length ? (
                  <div className="post-list">
                    {recent.slice(0, 5).map((p) => (
                      <PostRow key={p.id} post={p} />
                    ))}
                  </div>
                ) : (
                  <EmptyState />
                )}
              </section>
              <section>
                <div className="section-title">
                  <h2>Research notes</h2>
                  <span className="badge">FASTINPUT</span>
                </div>
                <Card>
                  <span className="eyebrow">LEARN BY DOING</span>
                  <h2>
                    풀이보다 오래 남는
                    <br />
                    이해를 기록합니다.
                  </h2>
                  <p className="muted">
                    문제의 핵심 원리, 검증 과정, 실패한 시도까지. 작은 기록을
                    쌓아 보안 역량을 만들어갑니다.
                  </p>
                  <Link className="button" href="/about">
                    프로필 보기 ↗
                  </Link>
                  <hr
                    style={{ borderColor: "var(--border)", margin: "24px 0" }}
                  />
                  <p className="muted">
                    나중에 읽고 싶은 글은 북마크로 모아보세요.
                  </p>
                  <Link href="/bookmarks" className="button">
                    ☆ 저장한 글
                  </Link>
                </Card>
              </section>
            </div>
          )}
        </>
      )}
    </main>
  );
}
