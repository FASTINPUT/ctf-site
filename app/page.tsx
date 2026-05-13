import Link from "next/link";

export default function Home() {
  return (
    <main className="p-10">
      <h1 className="text-4xl font-bold mb-4">CTF Writeups</h1>
      <p className="mb-6">드림핵 및 CTF 문제 풀이 기록</p>

      {/* 🔥 글 작성 버튼 */}
      <Link href="/write">
        <button className="mb-6 px-4 py-2 bg-white text-black rounded">
          글 작성
        </button>
      </Link>

      <h2 className="text-2xl font-semibold mb-2">카테고리</h2>

      <ul className="space-y-2">
        <li>
          <Link href="/web">Web</Link>
        </li>
        <li>
          <Link href="/pwn">Pwn</Link>
        </li>
        <li>
          <Link href="/crypto">Crypto</Link>
        </li>
      </ul>
    </main>
  );
}