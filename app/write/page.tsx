"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Category = {
  id: number;
  name: string;
  slug: string;
};

export default function WritePage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");
  const [checkingLogin, setCheckingLogin] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        router.push("/login");
        return;
      }

      const { data: categoryData } = await supabase
        .from("categories")
        .select("*")
        .order("id", { ascending: true });

      setCategories(categoryData || []);

      if (categoryData && categoryData.length > 0) {
        setCategory(categoryData[0].slug);
      }

      setCheckingLogin(false);
    }

    init();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const { error } = await supabase.from("posts").insert([
      {
        title,
        category,
        content,
        file_url: "",
      },
    ]);

    if (error) {
      setMessage("저장 실패: " + error.message);
      return;
    }

    setMessage("저장 성공!");
    setTitle("");
    setContent("");
  }

  if (checkingLogin) {
    return <main className="p-10 text-white">로그인 확인 중...</main>;
  }

  return (
    <main className="p-10 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6 text-white">Write Report</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="w-full p-3 border rounded bg-white text-black"
          placeholder="제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <select
          className="w-full p-3 border rounded bg-white text-black"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </select>

        <textarea
          className="w-full p-3 border rounded bg-white text-black h-64"
          placeholder="풀이 내용을 작성하세요"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <button className="px-4 py-2 bg-white text-black rounded">
          저장하기
        </button>
      </form>

      {message && <p className="mt-4 text-white">{message}</p>}
    </main>
  );
}