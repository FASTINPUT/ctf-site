"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function WritePage() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("web");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");

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
    setCategory("web");
    setContent("");
  }

  return (
    <main className="p-10 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Write Report</h1>

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
          <option value="web">Web</option>
          <option value="pwn">Pwn</option>
          <option value="crypto">Crypto</option>
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

      {message && <p className="mt-4">{message}</p>}
    </main>
  );
}