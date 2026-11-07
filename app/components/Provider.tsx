"use client";
import Link from "next/link";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { configured, supabase } from "@/app/lib/supabase";
import type { Category } from "@/app/lib/types";
const Context = createContext<{
  categories: Category[];
  user: User | null;
  admin: boolean;
  checking: boolean;
  error: string;
  reload: () => Promise<void>;
}>({
  categories: [],
  user: null,
  admin: false,
  checking: true,
  error: "",
  reload: async () => {},
});
export const useApp = () => useContext(Context);
export default function Provider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]),
    [user, setUser] = useState<User | null>(null),
    [admin, setAdmin] = useState(false),
    [checking, setChecking] = useState(configured),
    [error, setError] = useState("");
  const reload = useCallback(async () => {
    if (!configured) return;
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");
    if (error)
      setError(
        "카테고리를 불러오지 못했습니다. 연결과 읽기 권한을 확인하세요.",
      );
    else {
      setCategories(data || []);
      setError("");
    }
  }, []);
  useEffect(() => {
    if (!configured) {
      return;
    }
    let live = true;
    async function auth() {
      try {
        const { data } = await supabase.auth.getUser();
        if (!live) return;
        setUser(data.user);
        if (data.user) {
          const { data: allowed } = await supabase.rpc("fi_is_admin");
          if (live) setAdmin(allowed === true);
        } else setAdmin(false);
      } finally {
        if (live) setChecking(false);
      }
    }
    void auth();
    const timer = setTimeout(() => void reload(), 0);
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      setTimeout(() => void auth(), 0);
    });
    return () => {
      live = false;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [reload]);
  return (
    <Context.Provider
      value={{ categories, user, admin, checking, error, reload }}
    >
      {configured ? (
        children
      ) : (
        <div className="setup">
          <span className="eyebrow">FASTINPUT / CONFIGURATION</span>
          <h1>아카이브 연결을 준비하고 있습니다</h1>
          <p>
            .env.local에 NEXT_PUBLIC_SUPABASE_URL과
            NEXT_PUBLIC_SUPABASE_ANON_KEY를 설정한 뒤 서버를 다시 실행하세요.
          </p>
          <p>
            인증 키가 없는 상태에서는 데이터 요청과 로그인을 실행하지 않습니다.
            자세한 설정은 README.md를 확인하세요.
          </p>
        </div>
      )}
    </Context.Provider>
  );
}
export function AdminGate({ children }: { children: ReactNode }) {
  const { user, admin, checking } = useApp();
  if (checking) return <p role="status">권한 확인 중…</p>;
  if (!user)
    return (
      <div className="empty">
        <h1>로그인이 필요합니다</h1>
        <Link className="button primary" href="/login">
          로그인
        </Link>
      </div>
    );
  if (!admin)
    return (
      <div className="empty">
        <h1>관리자 권한이 필요합니다</h1>
        <p>
          관리자는 README의 권한 전환 절차와 fi_is_admin SQL 설정을 확인하세요.
        </p>
      </div>
    );
  return children;
}
