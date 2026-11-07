"use client";
import { useEffect, useState } from "react";
import { summaries } from "@/app/lib/queries";
import type { PostSummary } from "@/app/lib/types";
import { Card, EmptyState, Skeleton, Toast } from "../components/ui";
export default function Stats() {
  const [rows, setRows] = useState<PostSummary[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    summaries()
      .then(setRows)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  function counts(field: "category" | "difficulty" | "platform" | "month") {
    const map: Record<string, number> = {};
    rows.forEach((p) => {
      const key =
        field === "month"
          ? new Intl.DateTimeFormat("sv-SE", {
              year: "numeric",
              month: "2-digit",
              timeZone: "Asia/Seoul",
            }).format(new Date(p.created_at))
          : p[field] || "미지정";
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) =>
      field === "month" ? a[0].localeCompare(b[0]) : b[1] - a[1],
    );
  }
  return (
    <main>
      <div className="page-heading">
        <div>
          <span className="eyebrow">LEARNING / INSIGHTS</span>
          <h1>학습 통계</h1>
          <p>
            공개 게시글을 기준으로 집계한 학습 기록입니다. 월별 수치는 작성일
            기준입니다.
          </p>
        </div>
      </div>
      <Toast message={error} />
      {loading ? (
        <Skeleton />
      ) : !rows.length ? (
        <EmptyState title="집계할 학습 기록이 없습니다" />
      ) : (
        <div className="chart-grid">
          {(
            [
              ["category", "카테고리별 기록"],
              ["month", "월별 작성 수"],
              ["difficulty", "난이도별 분포"],
              ["platform", "플랫폼별 기록"],
            ] as const
          ).map(([field, label]) => {
            const values = counts(field),
              max = Math.max(...values.map((x) => x[1]));
            return (
              <Card key={field}>
                <h2>{label}</h2>
                {values.map(([key, count]) => (
                  <div className="chart-row" key={key}>
                    <span>{key}</span>
                    <div
                      className="bar"
                      role="img"
                      aria-label={`${key}: ${count}개`}
                    >
                      <span style={{ width: `${(count / max) * 100}%` }} />
                    </div>
                    <span>{count}</span>
                  </div>
                ))}
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
