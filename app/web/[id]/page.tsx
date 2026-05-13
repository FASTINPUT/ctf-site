"use client";

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
  category: string;
  content: string;
};

export default function PostDetail() {
  const params = useParams();
  const id = params.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function fetchPost() {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setPost(data);
    }

    if (id) {
      fetchPost();
    }
  }, [id]);

  if (errorMessage) {
    return (
      <main className="p-10 text-white">
        <h1 className="text-2xl font-bold mb-4">글을 불러오지 못했습니다</h1>
        <p>{errorMessage}</p>
        <p>현재 id: {id}</p>
      </main>
    );
  }

  if (!post) {
    return <main className="p-10 text-white">불러오는 중...</main>;
  }

  return (
    <main className="p-10 max-w-3xl text-white">
      <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
      <p className="mb-6 text-gray-300">카테고리: {post.category}</p>
      <div className="whitespace-pre-wrap">{post.content}</div>
    </main>
  );
}