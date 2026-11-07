"use client";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
export function Button({
  className = "",
  variant = "default",
  ...props
}: ComponentProps<"button"> & { variant?: "default" | "primary" | "danger" }) {
  return <button className={`button ${variant} ${className}`} {...props} />;
}
export function Card({ className = "", ...props }: ComponentProps<"section">) {
  return <section className={`card ${className}`} {...props} />;
}
export function Badge({ children }: { children: ReactNode }) {
  return <span className="badge">{children}</span>;
}
export function Input(props: ComponentProps<"input">) {
  return <input {...props} className={`input ${props.className || ""}`} />;
}
export function Select(props: ComponentProps<"select">) {
  return <select {...props} className={`input ${props.className || ""}`} />;
}
export function EmptyState({
  title = "아직 기록이 없습니다",
  description = "첫 번째 기록이 쌓이면 여기에 표시됩니다.",
  children,
}: {
  title?: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-icon" aria-hidden>
        ⌘
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {children}
    </div>
  );
}
export function Skeleton() {
  return (
    <div role="status" aria-label="불러오는 중" className="skeleton">
      <div />
      <div />
      <div />
    </div>
  );
}
export function Toast({ message }: { message: string }) {
  return message ? (
    <div className="notice" role="status" aria-live="polite">
      {message}
    </div>
  ) : null;
}
export function Breadcrumb({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav aria-label="현재 위치" className="breadcrumbs">
      <Link href="/">홈</Link>
      {items.map((x, i) => (
        <span key={i}>
          {" "}
          / {x.href ? <Link href={x.href}>{x.label}</Link> : x.label}
        </span>
      ))}
    </nav>
  );
}
export function Pagination({
  page,
  total,
  onChange,
}: {
  page: number;
  total: number;
  onChange: (n: number) => void;
}) {
  return total > 1 ? (
    <nav className="pagination" aria-label="페이지 이동">
      <Button disabled={page <= 1} onClick={() => onChange(page - 1)}>
        이전
      </Button>
      <span>
        {page} / {total}
      </span>
      <Button disabled={page >= total} onClick={() => onChange(page + 1)}>
        다음
      </Button>
    </nav>
  ) : null;
}
export function Tabs({
  items,
  value,
  onChange,
}: {
  items: string[];
  value: string;
  onChange: (s: string) => void;
}) {
  return (
    <div className="tabs" aria-label="보기 모드">
      {items.map((x) => (
        <button
          type="button"
          aria-pressed={value === x}
          key={x}
          onClick={() => onChange(x)}
          className={value === x ? "active" : ""}
        >
          {x}
        </button>
      ))}
    </div>
  );
}
export function Tooltip({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <span className="tooltip" title={label}>
      {children}
    </span>
  );
}
export function Dropdown({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <details
      className="dropdown"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.currentTarget.open = false;
          e.currentTarget.querySelector("summary")?.focus();
        }
      }}
    >
      <summary>{label}</summary>
      <div>{children}</div>
    </details>
  );
}
export function Modal({
  open,
  title,
  onClose,
  children,
  className,
}: {
  open: boolean;
  className?: string;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open) ref.current?.showModal();
    else ref.current?.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={className}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-label={title}
    >
      <div className="dialog-heading">
        <h2>{title}</h2>
        <Button onClick={onClose} aria-label="닫기">
          ×
        </Button>
      </div>
      {children}
    </dialog>
  );
}
export const Dialog = Modal;
export function ConfirmButton({
  onConfirm,
  children,
  message,
}: {
  onConfirm: () => Promise<void>;
  children: ReactNode;
  message: string;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>
        {children}
      </Button>
      <Modal
        open={open}
        onClose={() => {
          if (!busy) setOpen(false);
        }}
        title="삭제 확인"
      >
        <p>{message}</p>
        <div className="actions">
          <Button disabled={busy} onClick={() => setOpen(false)}>
            취소
          </Button>
          <Button
            variant="danger"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onConfirm();
                setOpen(false);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "처리 중…" : "삭제"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
