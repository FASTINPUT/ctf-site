import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import AuthButtons from "./components/AuthButtons";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Category = {
  id: number;
  name: string;
  slug: string;
};

export default async function Home() {
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("id", { ascending: true });

  return (
    <main className="p-10 text-white">
      <h1 className="text-4xl font-bold mb-4">CTF Writeups</h1>
      <p className="mb-6">드림핵 및 CTF 문제 풀이 기록</p>

      <div className="flex flex-wrap gap-3 mb-6">
        <AuthButtons />
      </div>

      <h2 className="text-2xl font-semibold mb-2">카테고리</h2>

      <ul className="space-y-2">
        {categories?.map((cat: Category) => (
          <li key={cat.id}>
            <Link href={`/${cat.slug}`} className="underline">
              {cat.name}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}