"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AuthButtons() {
  const [checking, setChecking] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    async function check() {
      const { data } = await supabase.auth.getSession();
      setIsLoggedIn(!!data.session);
      setChecking(false);
    }

    check();
  }, []);

  if (checking) {
    return null;
  }

  if (isLoggedIn) {
    return (
      <>
        <Link href="/write" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
          글 작성
        </Link>
        <Link href="/add-category" className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white">
          카테고리 추가
        </Link>
        <Link href="/manage-categories" className="rounded-xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-black">
          카테고리 관리
        </Link>
        <Link href="/logout" className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white">
          로그아웃
        </Link>
      </>
    );
  }

  return (
    <Link href="/login" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
      로그인
    </Link>
  );
}