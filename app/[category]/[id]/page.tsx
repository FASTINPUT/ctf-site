"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import type { Post, PostSummary } from "@/app/lib/types";
import { date, splitPages, safeUrl, downloadMarkdown } from "@/app/lib/content";
import Markdown from "@/app/components/Markdown";
import PostRow from "@/app/components/PostRow";
import { useApp } from "@/app/components/Provider";
import {
  Badge,
  Breadcrumb,
  Button,
  Card,
  ConfirmButton,
  Pagination,
  Skeleton,
  Toast,
} from "@/app/components/ui";
function PostDetail() {
  const params = useParams<{ category: string; id: string }>(),
    category = params.category,
    id = params.id,
    router = useRouter(),
    { admin } = useApp();
  const [post, setPost] = useState<Post | null>(null),
    [page, setPage] = useState(1),
    [related, setRelated] = useState<PostSummary[]>([]),
    [prev, setPrev] = useState<PostSummary | null>(null),
    [next, setNext] = useState<PostSummary | null>(null),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [bookmarked, setBookmarked] = useState(false),
    [toc, setToc] = useState<{ id: string; title: string; level: number }[]>(
      [],
    ),
    [active, setActive] = useState("");
  useEffect(() => {
    let live = true;
    async function load() {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("id", id)
        .eq("category", category)
        .maybeSingle();
      if (!live) return;
      if (error || !data) {
        setError("게시글을 찾을 수 없거나 읽기 권한이 없습니다.");
        return;
      }
      setPost(data);
      try {
        setBookmarked(
          JSON.parse(localStorage.getItem("fi-bookmarks") || "[]").includes(
            Number(id),
          ),
        );
      } catch {}
      const cols =
        "id,title,category,created_at";
      const [a, b, c] = await Promise.all([
        supabase
          .from("posts")
          .select(cols)
          .eq("category", category)
          .neq("id", id)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("posts")
          .select(cols)
          .eq("category", category)
          .lt("id", id)
          .order("id", { ascending: false })
          .limit(1),
        supabase
          .from("posts")
          .select(cols)
          .eq("category", category)
          .gt("id", id)
          .order("id")
          .limit(1),
      ]);
      if (live) {
        setRelated(a.data || []);
        setPrev(b.data?.[0] || null);
        setNext(c.data?.[0] || null);
      }
    }
    void load();
    return () => {
      live = false;
    };
  }, [id, category]);
  useEffect(() => {
    if (!post) return;
    const timer = setTimeout(() => {
      const elements = Array.from(
        document.querySelectorAll<HTMLElement>(
          ".reader-content h2[id],.reader-content h3[id]",
        ),
      );
      setToc(
        elements.map((e) => ({
          id: e.id,
          title: e.textContent || "",
          level: Number(e.tagName.slice(1)),
        })),
      );
      setActive(elements[0]?.id || "");
      const observer = new IntersectionObserver(
        (entries) => {
          const visible = entries.find((e) => e.isIntersecting);
          if (visible) setActive(visible.target.id);
        },
        { rootMargin: "-90px 0px -55% 0px" },
      );
      elements.forEach((e) => observer.observe(e));
      cleanup = () => observer.disconnect();
    }, 0);
    let cleanup = () => {};
    return () => {
      clearTimeout(timer);
      cleanup();
    };
  }, [post, page]);
  async function bookmark() {
    try {
      const ids = JSON.parse(
        localStorage.getItem("fi-bookmarks") || "[]",
      ) as number[];
      localStorage.setItem(
        "fi-bookmarks",
        JSON.stringify(
          bookmarked
            ? ids.filter((x) => x !== Number(id))
            : [...new Set([...ids, Number(id)])],
        ),
      );
      setBookmarked(!bookmarked);
      setMessage(
        bookmarked ? "북마크를 해제했습니다." : "이 브라우저에 북마크했습니다.",
      );
    } catch {
      setMessage("이 브라우저에서 북마크를 저장할 수 없습니다.");
    }
  }
  async function remove() {
    const { data, error } = await supabase
      .from("posts")
      .delete()
      .eq("id", id)
      .select("id")
      .single();
    if (error || !data) {
      setMessage("삭제에 실패했습니다. 관리자 권한과 연결을 확인하세요.");
      return;
    }
    router.push(`/${encodeURIComponent(category)}`);
  }
  if (error)
    return (
      <main>
        <Toast message={error} />
        <Link className="button" href="/writeups">
          목록으로
        </Link>
      </main>
    );
  if (!post) return <Skeleton />;
  const pages = splitPages(post.content || "");
  return (
    <main>
      <Breadcrumb
        items={[
          { label: post.category, href: `/${encodeURIComponent(category)}` },
          { label: post.title },
        ]}
      />
      <div className="reader-layout">
        <article className="card reader">
          <div className="actions" style={{ marginBottom: 16 }}>
            <Badge>{post.category}</Badge>
            {post.platform && <Badge>{post.platform}</Badge>}
            {post.difficulty && <Badge>{post.difficulty}</Badge>}
            {post.status && <Badge>{post.status}</Badge>}
          </div>
          <h1>{post.title}</h1>
          <div className="post-meta">
            <span>작성 {date(post.created_at)}</span>
            {post.updated_at && <span>수정 {date(post.updated_at)}</span>}
            {post.solved_at && <span>풀이 {date(post.solved_at)}</span>}
          </div>
          <div className="actions" style={{ margin: "15px 0" }}>
            {post.tags?.map((t) => (
              <Badge key={t}>#{t}</Badge>
            ))}
          </div>
          {post.problem_url && safeUrl(post.problem_url) && (
            <a
              className="button"
              href={post.problem_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              문제 원본 ↗
            </a>
          )}
          <div className="actions" style={{ marginTop: 20 }}>
            <Button aria-pressed={bookmarked} onClick={() => void bookmark()}>
              {bookmarked ? "★ 북마크됨" : "☆ 북마크"}
            </Button>
            <Button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(location.href);
                  setMessage("게시글 링크를 복사했습니다.");
                } catch {
                  setMessage(
                    "링크를 복사하지 못했습니다. 주소창에서 복사해 주세요.",
                  );
                }
              }}
            >
              링크 복사
            </Button>
            <Button
              onClick={() => {
                downloadMarkdown(post.title, post.content);
                setMessage(
                  "Markdown을 내보냈습니다. 첨부 파일은 기존 공개 링크로 유지됩니다.",
                );
              }}
            >
              Markdown 내보내기
            </Button>
            {admin && (
              <>
                <Link className="button" href={`/edit/${id}`}>
                  수정
                </Link>
                <Link className="button" href={`/write?duplicate=${id}`}>
                  복제
                </Link>
                <ConfirmButton
                  onConfirm={remove}
                  message="게시글을 삭제합니다. 첨부 파일은 자동 삭제되지 않으며 복구는 DB 백업이 필요합니다."
                >
                  삭제
                </ConfirmButton>
              </>
            )}
          </div>
          <Toast message={message} />
          <progress
            className="progress"
            value={page}
            max={pages.length}
            aria-label="페이지 진행 상태"
          />
          <div
            className="actions"
            style={{ justifyContent: "space-between", marginBottom: 24 }}
          >
            <span className="muted">
              {post.page_titles?.[page - 1] || `${page}페이지`} / {pages.length}
            </span>
            {pages.length > 1 && (
              <select
                className="input"
                style={{ width: "auto" }}
                aria-label="본문 페이지 선택"
                value={page}
                onChange={(e) => setPage(Number(e.target.value))}
              >
                {pages.map((_, i) => (
                  <option key={i} value={i + 1}>
                    {i + 1}. {post.page_titles?.[i] || "페이지"}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="reader-content">
            <Markdown content={pages[page - 1]} />
          </div>
          {post.file_url && safeUrl(post.file_url) && (
            <a
              className="button"
              href={post.file_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              기존 첨부 파일 보기 ↗
            </a>
          )}
          <Pagination page={page} total={pages.length} onChange={setPage} />
          <div
            className="actions"
            style={{ justifyContent: "space-between", marginTop: 28 }}
          >
            {prev ? (
              <Link href={`/${encodeURIComponent(prev.category)}/${prev.id}`}>
                ← {prev.title}
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link href={`/${encodeURIComponent(next.category)}/${next.id}`}>
                {next.title} →
              </Link>
            )}
          </div>
          <Button
            style={{ marginTop: 24 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            ↑ 상단으로
          </Button>
        </article>
        <aside>
          <details className="reader-toc" open>
            <summary>이 페이지의 목차</summary>
            {toc.length ? (
              toc.map((h) => (
                <a
                  key={h.id}
                  className={`${h.level === 3 ? "sub " : ""}${active === h.id ? "active" : ""}`}
                  href={`#${h.id}`}
                >
                  {h.title}
                </a>
              ))
            ) : (
              <p className="muted">H2 / H3 제목이 없습니다.</p>
            )}
            <p className="muted" style={{ marginTop: 24, fontSize: 11 }}>
              스포일러는 공개 내용을 접어 표시합니다. 비공개 데이터 보관 용도로
              사용할 수 없습니다.
            </p>
          </details>
        </aside>
      </div>
      <div className="section-title">
        <h2>같은 분야의 기록</h2>
      </div>
      {related.length ? (
        <div className="post-list">
          {related.map((p) => (
            <PostRow key={p.id} post={p} />
          ))}
        </div>
      ) : (
        <Card>
          <p className="muted">아직 관련 게시글이 없습니다.</p>
        </Card>
      )}
    </main>
  );
}

export default function PostPage() {
  const params = useParams<{ category: string; id: string }>();
  return <PostDetail key={`${params.category}/${params.id}`} />;
}
