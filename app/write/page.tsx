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
  const [pages, setPages] = useState<string[]>([""]);
  const [currentPage, setCurrentPage] = useState(0);

  const [message, setMessage] = useState("");
  const [checkingLogin, setCheckingLogin] = useState(true);
  const [uploading, setUploading] = useState(false);
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

  function updateCurrentPage(value: string) {
    setPages((prev) => {
      const next = [...prev];
      next[currentPage] = value;
      return next;
    });
  }

  function addPage() {
    setPages((prev) => [...prev, ""]);
    setCurrentPage(pages.length);
  }

  function deletePage() {
    if (pages.length === 1) {
      setMessage("최소 1페이지는 필요합니다.");
      return;
    }

    setPages((prev) => prev.filter((_, index) => index !== currentPage));
    setCurrentPage((prev) => Math.max(0, prev - 1));
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    try {
      setUploading(true);
      setMessage("파일 업로드 중...");

      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;

      const { error } = await supabase.storage
        .from("post-files")
        .upload(fileName, selectedFile);

      if (error) {
        setMessage("파일 업로드 실패: " + error.message);
        return;
      }

      const { data } = supabase.storage
        .from("post-files")
        .getPublicUrl(fileName);

      const fileUrl = data.publicUrl;
      const isImage = selectedFile.type.startsWith("image/");

      const markdownText = isImage
        ? `\n\n![${selectedFile.name}](${fileUrl})\n\n`
        : `\n\n[PDF 파일 보기 - ${selectedFile.name}](${fileUrl})\n\n`;

      updateCurrentPage(pages[currentPage] + markdownText);
      setMessage("파일 업로드 완료! 현재 페이지에 추가되었습니다.");
      e.target.value = "";
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const content = pages.join("\n\n---PAGE---\n\n");

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

    setTimeout(() => {
      router.push(`/${category}`);
    }, 500);
  }

  if (checkingLogin) {
    return <main className="p-10 text-white">로그인 확인 중...</main>;
  }

  return (
    <main className="min-h-screen px-6 py-12 text-white">
      <section className="mx-auto max-w-4xl">
        <div className="mb-8 rounded-2xl border border-slate-700 bg-slate-900/70 p-8 shadow-xl">
          <p className="mb-2 text-sm text-blue-300">Admin Editor</p>
          <h1 className="text-4xl font-bold">Write Report</h1>
          <p className="mt-3 text-slate-400">
            CTF 풀이를 Markdown 형식으로 작성하고 이미지/PDF를 삽입할 수 있습니다.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-slate-700 bg-slate-900/70 p-8 shadow-xl"
        >
          <input
            className="w-full rounded-xl border border-slate-600 bg-slate-950 p-4 text-white placeholder:text-slate-500"
            placeholder="제목"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <select
            className="w-full rounded-xl border border-slate-600 bg-slate-950 p-4 text-white"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>

          <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-4">
            <div className="mb-4 flex flex-wrap gap-2">
              {pages.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setCurrentPage(index)}
                  className={`rounded-lg px-3 py-2 text-sm ${
                    currentPage === index
                      ? "bg-blue-600 text-white"
                      : "bg-slate-700 text-white"
                  }`}
                >
                  {index + 1}페이지
                </button>
              ))}

              <button
                type="button"
                onClick={addPage}
                className="rounded-lg bg-green-600 px-3 py-2 text-sm text-white"
              >
                + 페이지 추가
              </button>

              <button
                type="button"
                onClick={deletePage}
                className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white"
              >
                현재 페이지 삭제
              </button>
            </div>

            <textarea
              className="h-96 w-full rounded-xl border border-slate-600 bg-slate-950 p-4 text-white placeholder:text-slate-500"
              placeholder={`현재 ${currentPage + 1}페이지 내용을 작성하세요

# 문제 분석

## 풀이 과정

이미지/PDF는 아래 파일 선택으로 업로드하면 현재 페이지에 자동 삽입됩니다.`}
              value={pages[currentPage]}
              onChange={(e) => updateCurrentPage(e.target.value)}
            />
          </div>

          <input
            type="file"
            accept="image/*,.pdf"
            className="w-full rounded-xl border border-slate-600 bg-slate-950 p-4 text-white"
            onChange={handleFileUpload}
            disabled={uploading}
          />

          <button
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
            disabled={uploading}
          >
            저장하기
          </button>
        </form>

        {message && <p className="mt-4 text-slate-300">{message}</p>}
      </section>
    </main>
  );
}