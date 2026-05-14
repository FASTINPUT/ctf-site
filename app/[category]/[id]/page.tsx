"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  created_at: string;
};

export default function PostDetail() {
  const params = useParams();
  const router = useRouter();

  const category = params.category as string;
  const id = params.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [deleteMessage, setDeleteMessage] = useState("");

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    async function init() {
      // 🔥 로그인 체크
      const { data } = await supabase.auth.getSession();

      setIsLoggedIn(!!data.session);
      setCheckingAuth(false);

      // 🔥 글 불러오기
      const { data: postData, error } = await supabase
        .from("posts")
        .select("*")
        .eq("id", id)
        .eq("category", category)
        .single();

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setPost(postData);
    }

    if (id && category) init();
  }, [id, category]);

  async function handleDelete() {
    if (!post) return;

    const ok = confirm("정말 삭제할까요?");
    if (!ok) return;

    const { error } = await supabase.from("posts").delete().eq("id", post.id);

    if (error) {
      setDeleteMessage("삭제 실패: " + error.message);
      return;
    }

    router.push(`/${post.category}`);
  }

  if (errorMessage) {
    return (
      <main className="p-10 text-white">
        <h1 className="text-2xl font-bold mb-4">글을 불러오지 못했습니다</h1>
        <p>{errorMessage}</p>
      </main>
    );
  }

  if (!post || checkingAuth) {
    return <main className="p-10 text-white">불러오는 중...</main>;
  }

  return (
    <main className="p-10 max-w-3xl text-white">
      <h1 className="text-3xl font-bold mb-4">{post.title}</h1>

      {/* 🔥 로그인한 경우만 버튼 */}
      {isLoggedIn && (
        <div className="flex items-center gap-3 mb-6">
          <Link
            href={`/edit/${post.id}`}
            className="px-4 py-2 rounded bg-white text-black text-sm font-medium"
          >
            수정
          </Link>

          <button
            onClick={handleDelete}
            className="px-4 py-2 rounded bg-red-600 text-white text-sm font-medium"
          >
            삭제
          </button>
        </div>
      )}

      <p className="mb-6 text-gray-300">
        카테고리: {post.category} /{" "}
        {new Date(post.created_at).toLocaleString()}
      </p>

      <div className="whitespace-pre-wrap">{post.content}</div>

      {deleteMessage && <p className="mt-4 text-red-400">{deleteMessage}</p>}
    </main>
  );
}