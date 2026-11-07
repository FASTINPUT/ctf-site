"use client";
import Link from "next/link";
import { useApp } from "./Provider";
import { Dropdown } from "./ui";
export default function AuthButtons() {
  const { user, admin, checking } = useApp();
  if (checking) return <span className="muted">확인 중…</span>;
  return (
    <>
      {admin && (
        <Dropdown label="관리자">
          <Link href="/write">새 글 작성</Link>
          <Link href="/add-category">카테고리 추가</Link>
          <Link href="/manage-categories">카테고리 관리</Link>
        </Dropdown>
      )}
      <Link className="button" href={user ? "/logout" : "/login"}>
        {user ? "로그아웃" : "로그인"}
      </Link>
    </>
  );
}
