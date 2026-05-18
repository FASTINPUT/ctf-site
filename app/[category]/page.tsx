"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Post = {
  id: number;
  title: string;
  content: string;
  category: string;
  created_at: string;
};

type Category = {
  id: number;
  name: string;
  slug: string;
};

const POSTS_PER_PAGE = 10;

export default function CategoryPage() {
  const params = useParams();
  const category = params.category as string;

  const [posts, setPosts] = useState<Post[]>([]);
  const [categoryInfo, setCategoryInfo] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortType, setSortType] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    async function fetchData() {
      const { data: categoryData } = await supabase
        .from("categories")
        .select("*")
        .eq("slug", category)
        .maybeSingle();

      setCategoryInfo(categoryData);

      const { data: postData } = await supabase
        .from("posts")
        .select("id,title,content,category,created_at")
        .eq("category", category);

      setPosts(postData || []);
      setLoading(false);
    }

    if (category) fetchData();
  }, [category]);

  function getFilteredAndSortedPosts() {
    const keyword = searchText.trim().toLowerCase();

    let result = posts.filter((post) => {
      const title = post.title?.toLowerCase() || "";
      const content = post.content?.toLowerCase() || "";

      return title.includes(keyword) || content.includes(keyword);
    });

    switch (sortType) {
      case "title_asc":
        result = result.sort((a, b) => a.title.localeCompare(b.title));
        break;

      case "title_desc":
        result = result.sort((a, b) => b.title.localeCompare(a.title));
        break;

      case "newest":
        result = result.sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        );
        break;

      case "oldest":
        result = result.sort(
          (a, b) =>
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime()
        );
        break;
    }

    return result;
  }

  const filteredPosts = getFilteredAndSortedPosts();
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const currentPosts = filteredPosts.slice(
    startIndex,
    startIndex + POSTS_PER_PAGE
  );

  if (loading) {
    return <main className="p-10 text-white">불러오는 중...</main>;
  }

  return (
    <main className="min-h-screen px-6 py-12 text-white">
      <section className="mx-auto max-w-4xl">
        <Link href="/" className="mb-6 inline-block text-blue-300 underline">
          ← 홈으로
        </Link>

        <div className="mb-8 rounded-2xl border border-slate-700 bg-slate-900/70 p-8 shadow-xl">
          <p className="mb-2 text-sm text-blue-300">Category</p>
          <h1 className="text-4xl font-bold">
            {categoryInfo?.name || category} Writeups
          </h1>
          <p className="mt-3 text-slate-400">
            제목과 본문 내용을 검색할 수 있습니다.
          </p>
        </div>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold">문제 목록</h2>

          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="제목/본문 검색"
              className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-400"
            />

            <select
              value={sortType}
              onChange={(e) => {
                setSortType(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white"
            >
              <option value="newest">최신순</option>
              <option value="oldest">오래된순</option>
              <option value="title_asc">제목순 A-Z</option>
              <option value="title_desc">제목 역순</option>
            </select>
          </div>
        </div>

        {currentPosts.length === 0 ? (
          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6 text-slate-400">
            검색 결과가 없거나 작성된 글이 없습니다.
          </div>
        ) : (
          <div className="space-y-4">
            {currentPosts.map((post) => (
              <Link
                key={post.id}
                href={`/${category}/${post.id}`}
                className="block rounded-2xl border border-slate-700 bg-slate-900/70 p-5 transition hover:-translate-y-1 hover:border-blue-400 hover:bg-slate-800"
              >
                <h3 className="text-xl font-semibold text-blue-300">
                  {post.title}
                </h3>
                <p className="mt-2 text-sm text-slate-400">
                  {new Date(post.created_at).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="rounded-lg bg-white px-3 py-2 text-black disabled:opacity-40"
            >
              이전
            </button>

            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`rounded-lg px-3 py-2 text-sm ${
                  currentPage === i + 1
                    ? "bg-blue-600 text-white"
                    : "bg-slate-700 text-white"
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="rounded-lg bg-white px-3 py-2 text-black disabled:opacity-40"
            >
              다음
            </button>
          </div>
        )}
      </section>
    </main>
  );
}