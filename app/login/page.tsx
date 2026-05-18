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

    router.push("/");
  }

  return (
    <main className="min-h-screen px-6 py-12 text-white">
      <section className="mx-auto max-w-md">
        <div className="mb-8 rounded-2xl border border-slate-700 bg-slate-900/70 p-8 shadow-xl">
          <p className="mb-2 text-sm text-blue-300">Admin</p>
          <h1 className="text-4xl font-bold">관리자 로그인</h1>
          <p className="mt-3 text-slate-400">
            글 작성, 수정, 삭제는 관리자 로그인 후 가능합니다.
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="space-y-5 rounded-2xl border border-slate-700 bg-slate-900/70 p-8 shadow-xl"
        >
          <input
            className="w-full rounded-xl border border-slate-600 bg-slate-950 p-4 text-white placeholder:text-slate-500"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="w-full rounded-xl border border-slate-600 bg-slate-950 p-4 text-white placeholder:text-slate-500"
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white">
            로그인
          </button>
        </form>

        {message && <p className="mt-4 text-red-400">{message}</p>}
      </section>
    </main>
  );
}