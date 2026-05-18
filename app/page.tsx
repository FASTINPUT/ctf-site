"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import AuthButtons from "./components/AuthButtons";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Category = {
  id: number;
  name: string;
  slug: string;
  created_at: string;
};

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [sortType, setSortType] = useState("name_asc");

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase.from("categories").select("*");
      setCategories(data || []);
    }

    fetchData();
  }, []);

  function getSortedCategories() {
    const sorted = [...categories];

    switch (sortType) {
      case "name_asc":
        return sorted.sort((a, b) => a.name.localeCompare(b.name));

      case "name_desc":
        return sorted.sort((a, b) => b.name.localeCompare(a.name));

      case "newest":
        return sorted.sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        );

      case "oldest":
        return sorted.sort(
          (a, b) =>
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime()
        );

      default:
        return sorted;
    }
  }

  const sortedCategories = getSortedCategories();

  return (
    <main className="min-h-screen px-6 py-12 text-white">
      <section className="mx-auto max-w-5xl">
        {/* 상단 */}
        <div className="mb-10 rounded-2xl border border-slate-700 bg-slate-900/70 p-8 shadow-xl">
          <p className="mb-3 text-sm text-blue-300">
            FASTINPUT Security Notes
          </p>

          <h1 className="mb-4 text-5xl font-bold tracking-tight">
            CTF Writeups
          </h1>

          <p className="mb-6 text-slate-300">
            드림핵 및 CTF 문제 풀이를 정리하는 포트폴리오 사이트입니다.
          </p>

          <div className="flex flex-wrap gap-3">
            <AuthButtons />
          </div>
        </div>

        {/* 카테고리 + 정렬 */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">카테고리</h2>

          <select
            value={sortType}
            onChange={(e) => setSortType(e.target.value)}
            className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-white border border-slate-600"
          >
            <option value="name_asc">이름순 (A-Z)</option>
            <option value="name_desc">이름 역순</option>
            <option value="newest">최신순</option>
            <option value="oldest">오래된순</option>
          </select>
        </div>

        {/* 카드 */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sortedCategories.map((cat) => (
            <Link
              key={cat.id}
              href={`/${cat.slug}`}
              className="group rounded-2xl border border-slate-700 bg-slate-900/70 p-6 transition hover:-translate-y-1 hover:border-blue-400 hover:bg-slate-800"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-300 font-bold">
                {cat.name.slice(0, 1)}
              </div>

              <h3 className="text-xl font-semibold group-hover:text-blue-300">
                {cat.name}
              </h3>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}