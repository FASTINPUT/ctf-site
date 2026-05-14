"use client";

import Link from "next/link";
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
  created_at: string;
};

export default function CategoryPage() {
  const params = useParams();
  const category = params.category as string;

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      const { data } = await supabase
        .from("posts")
        .select("*")
        .eq("category", category)
        .order("created_at", { ascending: false });

      setPosts(data || []);
      setLoading(false);
    }

    if (category) fetchPosts();
  }, [category]);

  if (loading) {
    return <main className="p-10 text-white">불러오는 중...</main>;
  }

  return (
    <main className="p-10 text-white">
      <h1 className="text-3xl font-bold mb-4">{category} Writeups</h1>

      <h2 className="text-2xl font-semibold mb-3">문제 목록</h2>

      <ul className="space-y-2">
        {posts.map((post) => (
          <li key={post.id}>
            <Link href={`/${category}/${post.id}`} className="underline">
              {post.title}
            </Link>
            <span className="ml-2 text-gray-400 text-sm">
              / {new Date(post.created_at).toLocaleDateString()}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}