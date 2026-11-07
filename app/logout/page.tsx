"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
export default function Logout() {
  const router = useRouter(),
    [error, setError] = useState("");
  useEffect(() => {
    supabase.auth.signOut().then(({ error }) => {
      if (error) setError("로그아웃에 실패했습니다. 다시 시도하세요.");
      else router.replace("/");
    });
  }, [router]);
  return <main role="status">{error || "로그아웃 중…"}</main>;
}
