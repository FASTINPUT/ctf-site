"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import { Button, Card, Input, Toast } from "../components/ui";
export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <main className="auth-card">
      <span className="eyebrow">FASTINPUT / ACCOUNT</span>
      <h1>다시 오셨군요.</h1>
      <p className="muted">관리자 계정으로 학습 기록을 이어가세요.</p>
      <Card>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy) return;
            setBusy(true);
            try {
              const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
              });
              if (error) throw error;
              router.push("/");
            } catch {
              setMessage(
                "로그인에 실패했습니다. 계정 정보와 연결을 확인하세요.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            이메일
            <Input
              required
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            비밀번호
            <Input
              required
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <Button variant="primary" disabled={busy}>
            {busy ? "로그인 중…" : "로그인"}
          </Button>
        </form>
        <Toast message={message} />
      </Card>
    </main>
  );
}
