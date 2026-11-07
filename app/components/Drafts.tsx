"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "./Provider";
import { Card } from "./ui";
export default function Drafts() {
  const { user, admin } = useApp(),
    [drafts, setDrafts] = useState<
      { href: string; title: string; saved: string }[]
    >([]);
  useEffect(() => {
    if (!user || !admin) return;
    const timer = setTimeout(() => {
      const result: { href: string; title: string; saved: string }[] = [];
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)!;
          if (!key.startsWith(`fi-draft:${user.id}:`)) continue;
          const item = JSON.parse(localStorage.getItem(key) || "null");
          if (!item?.form) continue;
          const id = key.split(":").pop();
          result.push({
            href: id === "new" ? "/write" : `/edit/${encodeURIComponent(id!)}`,
            title: item.form.title || "제목 없는 초안",
            saved: item.savedAt
              ? new Date(item.savedAt).toLocaleString("ko-KR")
              : "",
          });
        }
      } catch {}
      setDrafts(result);
    }, 0);
    return () => clearTimeout(timer);
  }, [user, admin]);
  if (!drafts.length) return null;
  return (
    <Card>
      <h2>이 기기의 작성 중인 초안</h2>
      {drafts.map((d, i) => (
        <div className="post-row" key={i}>
          <Link className="post-body" href={d.href}>
            {d.title}
          </Link>
          <small>{d.saved}</small>
        </div>
      ))}
    </Card>
  );
}
