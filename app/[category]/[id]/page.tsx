"use client";

import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Post = {
  id: number;
  title: string;
  category: string;
  content: string;
  created_at: string;
};

export default function PostDetail() {
  const params = useParams();
  const router = useRouter();

  const category = params.category as string;
  const id = params.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function fetchPost() {
      const { data: sessionData } = await supabase.auth.getSession();
      setIsLoggedIn(!!sessionData.session);

      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("id", id)
        .eq("category", category)
        .single();

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setPost(data);
    }

    if (id && category) fetchPost();
  }, [id, category]);

  async function handleDelete() {
    if (!post) return;

    const ok = confirm("정말 삭제할까요?");
    if (!ok) return;

    const { error } = await supabase.from("posts").delete().eq("id", post.id);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.push(`/${category}`);
  }

  if (errorMessage) {
    return <main className="p-10 text-red-400">{errorMessage}</main>;
  }

  if (!post) {
    return <main className="p-10 text-white">불러오는 중...</main>;
  }

  const pages = post.content ? post.content.split("---PAGE---") : [""];
  const pageContent = pages[currentPage] || "";

  return (
    <main className="min-h-screen px-6 py-12 text-white">
      <section className="mx-auto max-w-4xl">
        <div className="mb-6 flex gap-4 text-sm">
          <Link href={`/${category}`} className="text-blue-300 underline">
            ← 목록
          </Link>
          <Link href="/" className="text-blue-300 underline">
            홈으로
          </Link>
        </div>

        <article className="rounded-2xl border border-slate-700 bg-slate-900/70 p-8 shadow-xl">
          <p className="mb-3 text-sm text-blue-300">
            {post.category} / {new Date(post.created_at).toLocaleString()}
          </p>

          <h1 className="mb-6 text-4xl font-bold">{post.title}</h1>

          {isLoggedIn && (
            <div className="mb-8 flex gap-3 border-b border-slate-700 pb-6">
              <Link
                href={`/edit/${post.id}`}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
              >
                수정
              </Link>

              <button
                onClick={handleDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white"
              >
                삭제
              </button>
            </div>
          )}

          <p className="mb-4 text-sm text-slate-400">
            {currentPage + 1} / {pages.length} 페이지
          </p>

          <div className="min-h-[320px] rounded-xl border border-slate-800 bg-slate-950/50 p-6 leading-8 text-slate-100">
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 className="mb-4 mt-2 text-3xl font-bold text-white">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="mb-3 mt-6 text-2xl font-bold text-blue-300">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="mb-2 mt-5 text-xl font-semibold text-blue-200">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="mb-4 whitespace-pre-wrap text-slate-100">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="mb-4 ml-6 list-disc space-y-1">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="mb-4 ml-6 list-decimal space-y-1">
                    {children}
                  </ol>
                ),
                li: ({ children }) => <li>{children}</li>,
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-300 underline"
                  >
                    {children}
                  </a>
                ),
                img: ({ src, alt }) => (
                  <img
                    src={src || ""}
                    alt={alt || "image"}
                    className="my-6 max-w-full rounded-xl border border-slate-700"
                  />
                ),
                code: ({ children }) => (
                  <code className="rounded bg-slate-800 px-1 py-0.5 text-sm text-blue-200">
                    {children}
                  </code>
                ),
                pre: ({ children }) => (
                  <pre className="mb-4 overflow-x-auto rounded-xl bg-slate-950 p-4 text-sm">
                    {children}
                  </pre>
                ),
              }}
            >
              {pageContent}
            </ReactMarkdown>
          </div>

          {pages.length > 1 && (
            <div className="mt-8 flex items-center justify-between gap-4">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 0))}
                disabled={currentPage === 0}
                className="rounded-lg bg-white px-4 py-2 text-black disabled:opacity-40"
              >
                이전
              </button>

              <div className="flex flex-wrap gap-2">
                {pages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPage(index)}
                    className={`rounded-lg px-3 py-1 text-sm ${
                      currentPage === index
                        ? "bg-blue-600 text-white"
                        : "bg-slate-700 text-white"
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, pages.length - 1))
                }
                disabled={currentPage === pages.length - 1}
                className="rounded-lg bg-white px-4 py-2 text-black disabled:opacity-40"
              >
                다음
              </button>
            </div>
          )}
        </article>
      </section>
    </main>
  );
}