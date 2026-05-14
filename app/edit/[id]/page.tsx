"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function EditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("web");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function fetchPost() {
      const { data } = await supabase
        .from("posts")
        .select("*")
        .eq("id", id)
        .single();

      if (data) {
        setTitle(data.title);
        setCategory(data.category);
        setContent(data.content);
      }
    }

    if (id) fetchPost();
  }, [id]);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();

    const { error } = await supabase
      .from("posts")
      .update({
        title,
        category,
        content,
      })
      .eq("id", id);

    if (error) {
      setMessage("수정 실패: " + error.message);
      return;
    }

    setMessage("수정 완료!");

    setTimeout(() => {
      router.push(`/web/${id}`);
    }, 1000);
  }

  return (
    <main className="p-10 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6 text-white">글 수정</h1>

      <form onSubmit={handleUpdate} className="space-y-4">
        <input
          className="w-full p-3 border rounded bg-white text-black"
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
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <button className="px-4 py-2 bg-white text-black rounded">
          수정하기
        </button>
      </form>

      {message && <p className="mt-4 text-white">{message}</p>}
    </main>
  );
}