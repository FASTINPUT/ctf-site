"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AddCategoryPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [checkingLogin, setCheckingLogin] = useState(true);

  useEffect(() => {
    async function checkUser() {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        router.push("/login");
        return;
      }

      setCheckingLogin(false);
    }

    checkUser();
  }, [router]);

  function makeSlug(text: string) {
    return text.toLowerCase().trim().replace(/\s+/g, "-");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const slug = makeSlug(name);

    if (!name.trim()) {
      setMessage("카테고리 이름을 입력하세요.");
      return;
    }

    const { data: existing } = await supabase
      .from("categories")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      setMessage("이미 존재하는 카테고리입니다.");
      return;
    }

    const { error } = await supabase.from("categories").insert([
      {
        name: name.trim(),
        slug,
      },
    ]);

    if (error) {
      setMessage("추가 실패: " + error.message);
      return;
    }

    setMessage("카테고리 추가 완료!");

    setTimeout(() => {
      router.push("/");
    }, 800);
  }

  if (checkingLogin) {
    return <main className="p-10 text-white">로그인 확인 중...</main>;
  }

  return (
    <main className="min-h-screen px-6 py-12 text-white">
      <section className="mx-auto max-w-md">
        <div className="mb-8 rounded-2xl border border-slate-700 bg-slate-900/70 p-8 shadow-xl">
          <p className="mb-2 text-sm text-blue-300">Admin</p>
          <h1 className="text-4xl font-bold">카테고리 추가</h1>
          <p className="mt-3 text-slate-400">
            새 풀이 분류를 추가합니다. 예: Forensic, Reversing, C언어
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-slate-700 bg-slate-900/70 p-8 shadow-xl"
        >
          <input
            className="w-full rounded-xl border border-slate-600 bg-slate-950 p-4 text-white placeholder:text-slate-500"
            placeholder="카테고리 이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <button className="w-full rounded-xl bg-green-600 px-5 py-3 font-semibold text-white">
            추가하기
          </button>
        </form>

        {message && <p className="mt-4 text-slate-300">{message}</p>}
      </section>
    </main>
  );
}