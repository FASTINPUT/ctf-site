"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useApp } from "./Provider";
import AuthButtons from "./AuthButtons";
import { Button, Modal } from "./ui";
export const categoryIcon = (slug: string) =>
  /web/i.test(slug)
    ? "◎"
    : /pwn/i.test(slug)
      ? "⌁"
      : /revers/i.test(slug)
        ? "⌘"
        : /crypto/i.test(slug)
          ? "⛨"
          : /forensic/i.test(slug)
            ? "⌕"
            : "◇";
export default function Shell({ children }: { children: ReactNode }) {
  const { categories, admin, error, reload } = useApp(),
    path = usePathname();
  const [collapsed, setCollapsed] = useState(false),
    [mobile, setMobile] = useState(false);
  const search = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        setCollapsed(localStorage.getItem("fi-sidebar") === "1");
      } catch {}
    }, 0);
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        search.current?.focus();
      }
    };
    window.addEventListener("keydown", key);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", key);
    };
  }, []);
  function nav() {
    return (
      <>
        <p className="nav-label">WORKSPACE</p>
        {[
          ["/", "◫", "Dashboard"],
          ["/writeups", "≡", "All Writeups"],
          ["/bookmarks", "☆", "북마크"],
          ["/stats", "▤", "학습 통계"],
          ["/about", "⌘", "About"],
        ].map(([href, icon, label]) => (
          <Link
            className={path === href ? "nav-link selected" : "nav-link"}
            key={href}
            href={href}
            onClick={() => setMobile(false)}
            aria-current={path === href ? "page" : undefined}
          >
            <span aria-hidden>{icon}</span>
            <span>{label}</span>
          </Link>
        ))}
        <div className="nav-heading">
          <p className="nav-label">CATEGORIES</p>
          <Link href="/categories" title="전체 카테고리">
            ↗
          </Link>
        </div>
        {categories.map((c) => (
          <Link
            key={c.id}
            className={path === `/${c.slug}` ? "nav-link selected" : "nav-link"}
            href={`/${encodeURIComponent(c.slug)}`}
            onClick={() => setMobile(false)}
          >
            <span aria-hidden>{categoryIcon(c.slug)}</span>
            <span>{c.name}</span>
          </Link>
        ))}
        {admin && (
          <>
            <p className="nav-label">MANAGEMENT</p>
            <Link
              className="nav-link"
              href="/write"
              onClick={() => setMobile(false)}
            >
              ＋ 새 글 작성
            </Link>
            <Link
              className="nav-link"
              href="/manage-categories"
              onClick={() => setMobile(false)}
            >
              카테고리 관리
            </Link>
          </>
        )}
        <div className="sidebar-foot">
          <BadgeText /> <small>Build. Break. Understand.</small>
        </div>
      </>
    );
  }
  return (
    <div className={collapsed ? "shell collapsed" : "shell"}>
      <a className="skip" href="#main-content">
        본문으로 건너뛰기
      </a>
      <header className="topbar">
        <Button
          className="mobile-toggle"
          aria-label="메뉴 열기"
          onClick={() => setMobile(true)}
        >
          ☰
        </Button>
        <Link className="brand" href="/">
          <span className="brand-icon">F_</span>FASTINPUT
          <span className="brand-sub">/ research archive</span>
        </Link>
        <nav className="topnav" aria-label="주 메뉴">
          <Link href="/">Dashboard</Link>
          <Link href="/writeups">Writeups</Link>
          <Link href="/categories">Categories</Link>
        </nav>
        <form action="/writeups" className="global-search">
          <span aria-hidden>⌕</span>
          <input
            ref={search}
            name="q"
            aria-label="전체 글 검색"
            placeholder="아카이브 검색…"
          />
          <kbd>⌘ K</kbd>
        </form>
        <AuthButtons />
      </header>
      <aside className="sidebar">
        <Button
          className="collapse-button"
          aria-label={collapsed ? "사이드바 펼치기" : "사이드바 접기"}
          onClick={() => {
            setCollapsed(!collapsed);
            try {
              localStorage.setItem("fi-sidebar", collapsed ? "0" : "1");
            } catch {}
          }}
        >
          {collapsed ? "»" : "«"}
        </Button>
        <nav aria-label="사이드바">{nav()}</nav>
      </aside>
      <Modal
        className="mobile-drawer"
        open={mobile}
        onClose={() => setMobile(false)}
        title="탐색"
      >
        <nav aria-label="모바일 메뉴">{nav()}</nav>
      </Modal>
      <div className="workspace" id="main-content" tabIndex={-1}>
        {error && (
          <div className="notice" role="alert">
            {error} <Button onClick={() => void reload()}>다시 시도</Button>
          </div>
        )}
        {children}
        <footer>
          FASTINPUT <span>CTF Writeups & Security Notes</span>
          <span>기록에서 이해로.</span>
        </footer>
      </div>
    </div>
  );
}
function BadgeText() {
  return <span className="status-dot">Security learning archive</span>;
}
