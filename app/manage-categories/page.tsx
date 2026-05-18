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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

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

  function startEdit(category: Category) {
    setEditingId(category.id);
    setEditName(category.name);
    setMessage("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
  }

  async function handleUpdate(category: Category) {
    if (!editName.trim()) {
      setMessage("카테고리 이름을 입력하세요.");
      return;
    }

    const { error } = await supabase
      .from("categories")
      .update({ name: editName.trim() })
      .eq("id", category.id);

    if (error) {
      setMessage("수정 실패: " + error.message);
      return;
    }

    setMessage("수정 완료!");
    setEditingId(null);
    setEditName("");
    await fetchCategories();
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
    <main className="min-h-screen px-6 py-12 text-white">
      <section className="mx-auto max-w-3xl">
        <div className="mb-8 rounded-2xl border border-slate-700 bg-slate-900/70 p-8 shadow-xl">
          <p className="mb-2 text-sm text-blue-300">Admin</p>
          <h1 className="text-4xl font-bold">카테고리 관리</h1>
          <p className="mt-3 text-slate-400">
            카테고리 이름을 수정하거나 필요 없는 분류를 삭제할 수 있습니다.
          </p>
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900/70 p-6 shadow-xl">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="rounded-xl border border-slate-700 bg-slate-950/60 p-4"
            >
              {editingId === cat.id ? (
                <div className="space-y-3">
                  <input
                    className="w-full rounded-xl border border-slate-600 bg-slate-950 p-3 text-white"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />

                  <p className="text-sm text-slate-400">
                    slug는 유지됩니다: /{cat.slug}
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdate(cat)}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
                    >
                      저장
                    </button>

                    <button
                      onClick={cancelEdit}
                      className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold">{cat.name}</p>
                    <p className="text-sm text-slate-400">/{cat.slug}</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(cat)}
                      className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black"
                    >
                      수정
                    </button>

                    <button
                      onClick={() => handleDelete(cat)}
                      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {categories.length === 0 && (
            <p className="text-slate-400">등록된 카테고리가 없습니다.</p>
          )}
        </div>

        {message && <p className="mt-4 text-slate-300">{message}</p>}
      </section>
    </main>
  );
}