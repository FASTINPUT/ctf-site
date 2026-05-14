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

export default function ManageCategoriesPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [message, setMessage] = useState("");
  const [checkingLogin, setCheckingLogin] = useState(true);

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        router.push("/login");
        return;
      }

      await fetchCategories();
      setCheckingLogin(false);
    }

    init();
  }, [router]);

  async function fetchCategories() {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      setMessage("카테고리 불러오기 실패: " + error.message);
      return;
    }

    setCategories(data || []);
  }

  async function handleDelete(category: Category) {
    const ok = confirm(
      `"${category.name}" 카테고리를 삭제할까요?\n주의: 해당 카테고리의 글은 삭제되지 않습니다.`
    );

    if (!ok) return;

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", category.id);

    if (error) {
      setMessage("삭제 실패: " + error.message);
      return;
    }

    setMessage("삭제 완료!");
    await fetchCategories();
  }

  if (checkingLogin) {
    return <main className="p-10 text-white">로그인 확인 중...</main>;
  }

  return (
    <main className="p-10 max-w-2xl text-white">
      <h1 className="text-3xl font-bold mb-6">카테고리 관리</h1>

      <ul className="space-y-3">
        {categories.map((cat) => (
          <li
            key={cat.id}
            className="flex items-center justify-between border border-gray-700 rounded p-3"
          >
            <div>
              <p className="font-semibold">{cat.name}</p>
              <p className="text-sm text-gray-400">/{cat.slug}</p>
            </div>

            <button
              onClick={() => handleDelete(cat)}
              className="px-3 py-1 rounded bg-red-600 text-white text-sm"
            >
              삭제
            </button>
          </li>
        ))}
      </ul>

      {message && <p className="mt-4">{message}</p>}
    </main>
  );
}