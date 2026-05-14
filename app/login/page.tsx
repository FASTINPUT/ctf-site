"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage("로그인 실패: " + error.message);
      return;
    }

    router.push("/write");
  }

  return (
    <main className="p-10 max-w-md text-white">
      <h1 className="text-3xl font-bold mb-6">관리자 로그인</h1>

      <form onSubmit={handleLogin} className="space-y-4">
        <input
          className="w-full p-3 border rounded bg-white text-black"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full p-3 border rounded bg-white text-black"
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="px-4 py-2 bg-white text-black rounded">
          로그인
        </button>
      </form>

      {message && <p className="mt-4">{message}</p>}
    </main>
  );
}