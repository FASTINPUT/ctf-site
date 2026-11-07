import Link from "next/link";
import type { PostSummary } from "@/app/lib/types";
import { date } from "@/app/lib/content";
import { Badge } from "./ui";
export default function PostRow({ post }: { post: PostSummary }) {
  return (
    <Link
      className="post-row"
      href={`/${encodeURIComponent(post.category)}/${post.id}`}
    >
      <div className="post-body">
        <div className="actions">
          <Badge>{post.category}</Badge>
          {post.difficulty && <small>{post.difficulty}</small>}
          {post.status && <small>{post.status}</small>}
        </div>
        <h3>{post.title}</h3>
        <div className="post-meta">
          {post.platform && <span>{post.platform}</span>}
          <span>작성 {date(post.created_at)}</span>
          {post.updated_at && <span>수정 {date(post.updated_at)}</span>}
          {post.tags?.slice(0, 3).map((t) => (
            <span key={t}>#{t}</span>
          ))}
        </div>
      </div>
      <span className="post-arrow" aria-hidden>
        ↗
      </span>
    </Link>
  );
}
