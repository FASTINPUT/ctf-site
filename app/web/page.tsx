import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function WebPage() {
  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .eq("category", "web")
    .order("id", { ascending: false });

  return (
    <main className="p-10 text-white">
      <h1 className="text-3xl font-bold mb-4">Web Writeups</h1>
      <p className="mb-6">웹 해킹 문제 풀이</p>

      <h2 className="text-2xl font-semibold mb-3">문제 목록</h2>

      <ul className="space-y-2">
        {posts?.map((post) => (
          <li key={post.id}>
            <Link href={`/web/${post.id}`} className="underline">
              {post.title}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}