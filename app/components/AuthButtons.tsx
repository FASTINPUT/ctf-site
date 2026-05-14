"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AuthButtons() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    async function check() {
      const { data } = await supabase.auth.getSession();
      setIsLoggedIn(!!data.session);
    }

    check();
  }, []);

  if (isLoggedIn) {
    return (
      <>
        <Link
          href="/write"
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          글 작성
        </Link>

        <Link
          href="/add-category"
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          카테고리 추가
        </Link>

        <Link
          href="/manage-categories"
          className="px-4 py-2 bg-yellow-600 text-white rounded"
        >
          카테고리 관리
        </Link>

        <Link
          href="/logout"
          className="px-4 py-2 bg-red-600 text-white rounded"
        >
          로그아웃
        </Link>
      </>
    );
  }

  return (
    <Link
      href="/login"
      className="px-4 py-2 bg-white text-black rounded"
    >
      로그인
    </Link>
  );
}