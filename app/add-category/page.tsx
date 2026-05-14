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
    }, 1000);
  }

  if (checkingLogin) {
    return <main className="p-10 text-white">로그인 확인 중...</main>;
  }

  return (
    <main className="p-10 max-w-md text-white">
      <h1 className="text-3xl font-bold mb-6">카테고리 추가</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="w-full p-3 border rounded bg-white text-black"
          placeholder="카테고리 이름 (예: Forensic)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <button className="px-4 py-2 bg-white text-black rounded">
          추가하기
        </button>
      </form>

      {message && <p className="mt-4">{message}</p>}
    </main>
  );
}