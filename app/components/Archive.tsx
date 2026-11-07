"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { searchPosts } from "@/app/lib/queries";
import type { PostSummary } from "@/app/lib/types";
import { useApp } from "./Provider";
import {
  Input,
  Select,
  Button,
  Pagination,
  Skeleton,
  EmptyState,
  Toast,
  Breadcrumb,
} from "./ui";
import PostRow from "./PostRow";
export default function Archive({
  category,
  bookmarks = false,
}: {
  category?: string;
  bookmarks?: boolean;
}) {
  const { categories } = useApp(),
    [q, setQ] = useState(""),
    [filter, setFilter] = useState(category || ""),
    [sort, setSort] = useState("newest"),
    [difficulty, setDifficulty] = useState(""),
    [platform, setPlatform] = useState(""),
    [page, setPage] = useState(1),
    [posts, setPosts] = useState<PostSummary[]>([]),
    [count, setCount] = useState(0),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0),
    [options, setOptions] = useState<{
      platforms: string[];
      difficulties: string[];
    }>({ platforms: [], difficulties: [] });
  useEffect(() => {
    const timer = setTimeout(
      () => setQ(new URLSearchParams(window.location.search).get("q") || ""),
      0,
    );
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    let live = true;
    supabase.rpc("archive_facets").then(({ data }) => {
      if (live && data) setOptions(data);
    });
    return () => {
      live = false;
    };
  }, []);
  useEffect(() => {
    let live = true;
    const timeout = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        let bookmarkIds: number[] | undefined;
        if (bookmarks) {
          let ids: number[] = [];
          try {
            ids = JSON.parse(
              localStorage.getItem("fi-bookmarks") || "[]",
            ).filter((n: unknown) => typeof n === "number");
          } catch {}
          if (!ids.length) {
            if (live) {
              setPosts([]);
              setCount(0);
            }
            return;
          }
          bookmarkIds = ids;
        }
        const result = await searchPosts({
          q,
          category: filter,
          difficulty,
          platform,
          sort,
          page,
          ids: bookmarkIds,
        });
        if (live) {
          setPosts(result.posts);
          setCount(result.count);
        }
      } catch (e) {
        if (live) setError((e as Error).message);
      } finally {
        if (live) setLoading(false);
      }
    }, 250);
    return () => {
      live = false;
      clearTimeout(timeout);
    };
  }, [q, filter, sort, difficulty, platform, page, bookmarks, retry]);
  const title = bookmarks
    ? "북마크"
    : category
      ? `${categories.find((c) => c.slug === category)?.name || category} Writeups`
      : "All Writeups";
  return (
    <main>
      <Breadcrumb items={[{ label: title }]} />
      <div className="page-heading">
        <div>
          <span className="eyebrow">EXPLORE / ARCHIVE</span>
          <h1>{title}</h1>
          <p>
            {bookmarks
              ? "이 브라우저에 저장한 글입니다. 브라우저 데이터를 삭제하면 북마크도 지워집니다."
              : "제목과 본문을 검색하고, 관심 있는 분야의 풀이를 탐색하세요."}
          </p>
        </div>
        <span className="badge">{count} records</span>
      </div>
      <div className="filterbar">
        <Input
          value={q}
          aria-label="제목 및 본문 검색"
          placeholder="제목 / 본문 검색…"
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
        <Select
          aria-label="카테고리 필터"
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">모든 카테고리</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select
          aria-label="정렬"
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setPage(1);
          }}
        >
          <option value="newest">최신 작성순</option>
          <option value="updated">최근 수정순</option>
          <option value="oldest">오래된순</option>
          <option value="title">제목순</option>
        </Select>
        {options.difficulties.length > 0 && (
          <Select
            aria-label="난이도 필터"
            value={difficulty}
            onChange={(e) => {
              setDifficulty(e.target.value);
              setPage(1);
            }}
          >
            <option value="">모든 난이도</option>
            {options.difficulties.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </Select>
        )}
        {options.platforms.length > 0 && (
          <Select
            aria-label="플랫폼 필터"
            value={platform}
            onChange={(e) => {
              setPlatform(e.target.value);
              setPage(1);
            }}
          >
            <option value="">모든 플랫폼</option>
            {options.platforms.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </Select>
        )}
        <Button
          onClick={() => {
            setQ("");
            setFilter(category || "");
            setDifficulty("");
            setPlatform("");
            setSort("newest");
            setPage(1);
            window.history.replaceState(null, "", window.location.pathname);
          }}
        >
          초기화
        </Button>
      </div>
      <Toast message={error} />
      {error ? (
        <Button onClick={() => setRetry((n) => n + 1)}>다시 시도</Button>
      ) : loading ? (
        <Skeleton />
      ) : posts.length ? (
        <>
          <div className="post-list">
            {posts.map((p) => (
              <PostRow key={p.id} post={p} />
            ))}
          </div>
          <Pagination
            page={page}
            total={Math.ceil(count / 12)}
            onChange={setPage}
          />
        </>
      ) : (
        <EmptyState
          title="표시할 글이 없습니다"
          description="검색 조건을 바꾸거나 나중에 다시 방문해 주세요."
        />
      )}
    </main>
  );
}
