"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import {
  joinPages,
  splitPages,
  template,
  validateFile,
  validateSignature,
  safeUrl,
  looksSensitive,
} from "@/app/lib/content";
import { useApp, AdminGate } from "./Provider";
import {
  Button,
  Card,
  Input,
  Select,
  Tabs,
  Toast,
  Skeleton,
  Modal,
} from "./ui";
import Markdown from "./Markdown";
import {savePost} from "@/app/lib/save-post";
type Form = {
  title: string;
  category: string;
  platform: string;
  problem_url: string;
  difficulty: string;
  tags: string;
  status: string;
  solved_at: string;
  pages: string[];
  page_titles: string[];
};
const blank: Form = {
  title: "",
  category: "",
  platform: "",
  problem_url: "",
  difficulty: "",
  tags: "",
  status: "",
  solved_at: "",
  pages: [""],
  page_titles: [""],
};
const toolbar = [
  ["H2", "## 제목\n"],
  ["B", "**굵게**"],
  ["I", "*기울임*"],
  ["링크", "[링크 텍스트](https://example.com)"],
  ["코드", "`code`"],
  ["코드 블록", '\n```python\nprint("hello")\n```\n'],
  ["인용", "\n> 인용문\n"],
  ["목록", "\n- 항목\n"],
  ["표", "\n| 제목 | 설명 |\n| --- | --- |\n| 값 | 내용 |\n"],
  ["이미지", "![대체 텍스트](https://example.com/image.png)"],
  ["구분선", "\n---\n"],
  ["스포일러", "\n:::spoiler FLAG / 정답\n내용\n:::\n"],
];
function EditorBody({ id }: { id?: string }) {
  const { user, categories } = useApp(),
    router = useRouter();
  const [form, setForm] = useState<Form>(blank),
    [page, setPage] = useState(0),
    [mode, setMode] = useState("분할 보기"),
    [loading, setLoading] = useState(true),
    [loadError, setLoadError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [uploading, setUploading] = useState(false),
    [progress, setProgress] = useState(""),
    [saved, setSaved] = useState(""),
    [draft, setDraft] = useState<Form | null>(null),
    [alt, setAlt] = useState(""),
    [templateOpen, setTemplateOpen] = useState(false),
    [deleteOpen, setDeleteOpen] = useState(false),
    [baseline, setBaseline] = useState("");
  const text = useRef<HTMLTextAreaElement>(null),
    files = useRef<HTMLInputElement>(null),
    allowExit = useRef(false),
    uploadLock = useRef(false);
  const key = `fi-draft:${user?.id}:${id || "new"}`;
  const dirty = !loading && JSON.stringify(form) !== baseline;
  function change<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  useEffect(() => {
    let live = true;
    async function load() {
      try {
        let initial = { ...blank, category: categories[0]?.slug || "" };
        if (id) {
          const { data, error } = await supabase
            .from("posts")
            .select("*")
            .eq("id", id)
            .single();
          if (error || !data)
            throw Error(
              "글을 불러오지 못했습니다. 기존 글을 보호하기 위해 저장을 차단했습니다.",
            );
          initial = {
            title: data.title,
            category: data.category,
            platform: data.platform || "",
            problem_url: data.problem_url || "",
            difficulty: data.difficulty || "",
            tags: (data.tags || []).join(", "),
            status: data.status || "",
            solved_at: data.solved_at || "",
            pages: splitPages(data.content || ""),
            page_titles: data.page_titles || [],
          };
        } else {
          const source = new URLSearchParams(location.search).get("duplicate");
          if (source) {
            const { data, error } = await supabase
              .from("posts")
              .select("*")
              .eq("id", source)
              .single();
            if (error) throw Error("복제 원본을 읽지 못했습니다.");
            if (data)
              initial = {
                ...initial,
                title: `${data.title} (복사)`,
                category: data.category,
                platform: data.platform || "",
                problem_url: data.problem_url || "",
                difficulty: data.difficulty || "",
                tags: (data.tags || []).join(", "),
                status: data.status || "",
                pages: splitPages(data.content || ""),
                page_titles: data.page_titles || [],
              };
          }
        }
        if (!live) return;
        setBaseline(JSON.stringify(initial));
        setForm(initial);
        try {
          const raw = JSON.parse(localStorage.getItem(key) || "null");
          if (
            raw?.form &&
            Array.isArray(raw.form.pages) &&
            raw.form.pages.length &&
            raw.form.pages.every((p: unknown) => typeof p === "string") &&
            typeof raw.form.title === "string"
          )
            setDraft({
              ...blank,
              ...raw.form,
              page_titles: Array.isArray(raw.form.page_titles)
                ? raw.form.page_titles
                : [],
            });
        } catch {}
        setLoading(false);
      } catch (e) {
        if (live) {
          setLoadError((e as Error).message);
          setLoading(false);
        }
      }
    }
    void load();
    return () => {
      live = false;
    };
  }, [id, key, categories]);
  useEffect(() => {
    if (!dirty || draft || loadError) return;
    const timer = setTimeout(() => {
      try {
        if (looksSensitive(JSON.stringify(form))) {
          localStorage.removeItem(key);
          setSaved("");
          setMessage(
            "비밀 키로 의심되는 내용이 있어 로컬 초안을 저장하지 않았습니다. 키를 제거하세요. 모든 종류의 비밀값을 탐지할 수는 없습니다.",
          );
          return;
        }
        localStorage.setItem(
          key,
          JSON.stringify({ form, savedAt: new Date().toISOString() }),
        );
        setSaved(new Date().toLocaleTimeString("ko-KR"));
      } catch {
        setMessage(
          "초안을 저장할 공간이 부족하거나 로컬 저장소가 차단되어 있습니다.",
        );
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [form, dirty, draft, key, loadError]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty && !allowExit.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    const click = (e: MouseEvent) => {
      const a = (e.target as Element).closest("a[href]");
      if (
        dirty &&
        !allowExit.current &&
        a &&
        a.getAttribute("href") !== location.pathname &&
        !window.confirm(
          "저장하지 않은 변경 사항이 있습니다. 이동할까요? 로컬 초안은 이 브라우저에 남습니다.",
        )
      )
        e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    document.addEventListener("click", click, true);
    return () => {
      window.removeEventListener("beforeunload", warn);
      document.removeEventListener("click", click, true);
    };
  }, [dirty]);
  function insert(value: string, atPage = page, start?: number, end?: number) {
    setForm((f) => {
      const pages = [...f.pages],
        old = pages[atPage] || "";
      pages[atPage] =
        old.slice(0, start ?? old.length) +
        value +
        old.slice(end ?? start ?? old.length);
      return { ...f, pages };
    });
  }
  function tool(value: string) {
    const el = text.current;
    const start = el?.selectionStart,
      end = el?.selectionEnd;
    insert(value, page, start, end);
    requestAnimationFrame(() => {
      el?.focus();
      if (start !== undefined)
        el?.setSelectionRange(start + value.length, start + value.length);
    });
  }
  async function upload(list: FileList | File[]) {
    if (uploadLock.current) return;
    uploadLock.current = true;
    setUploading(true);
    const target = page,
      position = text.current?.selectionStart;
    let inserted = "";
    try {
      for (let i = 0; i < list.length; i++) {
        const file = list[i],
          invalid = validateFile(file);
        if (invalid) throw Error(`${file.name}: ${invalid}`);
        if (!(await validateSignature(file)))
          throw Error(`${file.name}: 파일 내용과 형식이 일치하지 않습니다.`);
        setProgress(`${i + 1} / ${list.length} 업로드 중: ${file.name}`);
        const name = `${user!.id}/${crypto.randomUUID()}.${file.name.split(".").pop()!.toLowerCase()}`;
        const { error } = await supabase.storage
          .from("post-files")
          .upload(name, file, { contentType: file.type, upsert: false });
        if (error) throw Error(`업로드 실패: ${error.message}`);
        const { data } = supabase.storage.from("post-files").getPublicUrl(name);
        const label = (alt.trim() || file.name).replace(/[\[\]\\\n\r]/g, "");
        const md = `\n\n${file.type.startsWith("image/") ? "!" : ""}[${label}](${data.publicUrl})\n\n`;
        insert(
          md,
          target,
          position === undefined ? undefined : position + inserted.length,
        );
        inserted += md;
      }
      setMessage(
        "첨부가 본문에 추가되었습니다. 게시글 저장 전 업로드 파일은 Storage에 남습니다.",
      );
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      uploadLock.current = false;
      setUploading(false);
      setProgress("");
      if (files.current) files.current.value = "";
    }
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy || uploading) return;
    if (
      !form.title.trim() ||
      !form.category ||
      !form.pages.some((p) => p.trim())
    ) {
      setMessage("제목, 카테고리, 본문을 입력하세요.");
      return;
    }
    if (
      (form.problem_url && !safeUrl(form.problem_url)) ||
      (form.problem_url && !/^https?:\/\//i.test(form.problem_url))
    ) {
      setMessage("문제 URL은 http 또는 https 주소여야 합니다.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const { data: allowed, error: authError } =
        await supabase.rpc("fi_is_admin");
      if (authError || allowed !== true)
        throw Error("관리자 권한을 확인하지 못했습니다.");
      const payload = {
        title: form.title.trim(),
        category: form.category,
        content: joinPages(form.pages),
        platform: form.platform.trim() || null,
        problem_url: form.problem_url.trim() || null,
        difficulty: form.difficulty || null,
        tags: [
          ...new Set(
            form.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean),
          ),
        ],
        status: form.status || null,
        solved_at: form.solved_at || null,
        page_titles: form.pages.map((_, i) => form.page_titles[i] || ""),
      };
      const result = await savePost(payload,id);
      const unsavedMetadata = result.omitted.some(field=>{
        const value=payload[field as keyof typeof payload];
        return Array.isArray(value)?value.some(x=>Boolean(x)):Boolean(value);
      });
      setBaseline(JSON.stringify(form));
      allowExit.current = true;
      try {
        if(unsavedMetadata&&!looksSensitive(JSON.stringify(form))) {
          localStorage.setItem(key,JSON.stringify({form,savedAt:new Date().toISOString(),pendingMetadata:true}));
        } else localStorage.removeItem(key);
      } catch {}
      if(unsavedMetadata)window.alert('제목·카테고리·본문·페이지 순서는 저장했습니다. 현재 DB에서 지원하지 않는 추가 항목은 저장하지 못했습니다. 비밀 키가 포함되지 않은 경우 이 기기에 복구용 초안으로 남겼습니다.');
      setMessage("저장 완료");
      router.push(`/${encodeURIComponent(form.category)}/${result.id}`);
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function move(delta: number) {
    const target = page + delta;
    if (target < 0 || target >= form.pages.length) return;
    setForm((f) => {
      const pages = [...f.pages],
        titles = f.pages.map((_, i) => f.page_titles[i] || "");
      [pages[page], pages[target]] = [pages[target], pages[page]];
      [titles[page], titles[target]] = [titles[target], titles[page]];
      return { ...f, pages, page_titles: titles };
    });
    setPage(target);
  }
  if (loading) return <Skeleton />;
  if (loadError) return <Toast message={loadError} />;
  return (
    <main>
      <div className="page-heading">
        <div>
          <span className="eyebrow">WORKSPACE / EDITOR</span>
          <h1>{id ? "Writeup 수정" : "새 Writeup 작성"}</h1>
          <p>분석부터 검증까지, 배운 내용을 하나의 기록으로.</p>
        </div>
        <Link className="button" href="/writeups">
          아카이브로
        </Link>
      </div>
      <Toast message={message} />
      <Modal open={!!draft} title="저장된 초안이 있습니다" onClose={() => {}}>
        <p>이 계정과 글에 저장된 로컬 초안을 복구할까요?</p>
        <div className="actions">
          <Button
            onClick={() => {
              try {
                localStorage.removeItem(key);
              } catch {}
              setDraft(null);
            }}
          >
            초안 버리기
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              if (draft) setForm(draft);
              setDraft(null);
              setSaved("복구됨");
            }}
          >
            초안 복구
          </Button>
        </div>
      </Modal>
      <form onSubmit={submit}>
        <fieldset
          disabled={busy || uploading}
          style={{ border: 0, padding: 0, minWidth: 0 }}
        >
          <Card>
            <div className="editor-meta">
              <label className="full">
                글 제목 *
                <Input
                  required
                  maxLength={250}
                  value={form.title}
                  onChange={(e) => change("title", e.target.value)}
                  placeholder="문제 이름과 핵심 주제를 입력하세요"
                />
              </label>
              <label>
                카테고리 *
                <Select
                  required
                  value={form.category}
                  onChange={(e) => change("category", e.target.value)}
                >
                  <option value="">선택하세요</option>
                  {!categories.some((c) => c.slug === form.category) &&
                    form.category && (
                      <option value={form.category}>
                        {form.category} (기존 분류)
                      </option>
                    )}
                  {categories.map((c) => (
                    <option value={c.slug} key={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </label>
              <label>
                문제 플랫폼
                <Input
                  list="platforms"
                  value={form.platform}
                  maxLength={80}
                  onChange={(e) => change("platform", e.target.value)}
                  placeholder="선택 또는 직접 입력"
                />
                <datalist id="platforms">
                  {["Dreamhack", "Hack The Box", "picoCTF", "PortSwigger"].map(
                    (p) => (
                      <option key={p}>{p}</option>
                    ),
                  )}
                </datalist>
              </label>
              <label>
                난이도
                <Select
                  value={form.difficulty}
                  onChange={(e) => change("difficulty", e.target.value)}
                >
                  <option value="">선택 안 함</option>
                  {["Easy", "Medium", "Hard"].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                  {form.difficulty &&
                    !["Easy", "Medium", "Hard"].includes(form.difficulty) && (
                      <option>{form.difficulty}</option>
                    )}
                </Select>
              </label>
              <label>
                문제 URL
                <Input
                  type="url"
                  value={form.problem_url}
                  onChange={(e) => change("problem_url", e.target.value)}
                  placeholder="https://…"
                />
              </label>
              <label>
                해결 상태
                <Select
                  value={form.status}
                  onChange={(e) => change("status", e.target.value)}
                >
                  <option value="">선택 안 함</option>
                  {["분석 중", "풀이 중", "해결 완료"].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </Select>
              </label>
              <label>
                풀이 날짜
                <Input
                  type="date"
                  value={form.solved_at}
                  onChange={(e) => change("solved_at", e.target.value)}
                />
              </label>
              <label className="full">
                태그 (쉼표로 구분)
                <Input
                  value={form.tags}
                  maxLength={500}
                  onChange={(e) => change("tags", e.target.value)}
                  placeholder="sqli, authentication, python"
                />
              </label>
            </div>
          </Card>
          <div className="draft-bar">
            <span>
              {dirty ? "● 저장되지 않은 변경 사항" : "✓ 저장 상태와 동일"}
            </span>
            <span>
              {saved
                ? `로컬 초안: ${saved}`
                : "로컬 초안은 입력 후 자동 저장됩니다"}
            </span>
            <Button type="button" onClick={() => setTemplateOpen(true)}>
              CTF 템플릿
            </Button>
          </div>
          <p className="muted" style={{ fontSize: 11 }}>
            초안은 이 기기에만 보관됩니다. 인증 키·토큰·비밀번호 등 비밀값은
            작성하지 마세요. 스포일러는 내용을 접는 기능이며 접근 권한을
            제한하지 않습니다.
          </p>
          <Card className="editor-card">
            <div className="editor-pagebar">
              {form.pages.map((_, i) => (
                <Button
                  key={i}
                  type="button"
                  aria-pressed={page === i}
                  variant={page === i ? "primary" : "default"}
                  onClick={() => setPage(i)}
                >
                  {i + 1}. {form.page_titles[i] || "페이지"}
                </Button>
              ))}
              <Button
                type="button"
                onClick={() => {
                  change("pages", [...form.pages, ""]);
                  setPage(form.pages.length);
                }}
              >
                ＋ 페이지
              </Button>
              <Button
                type="button"
                disabled={page === 0}
                onClick={() => move(-1)}
              >
                ← 순서
              </Button>
              <Button
                type="button"
                disabled={page === form.pages.length - 1}
                onClick={() => move(1)}
              >
                순서 →
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={form.pages.length === 1}
                onClick={() => setDeleteOpen(true)}
              >
                페이지 삭제
              </Button>
            </div>
            <div className="editor-pagebar">
              <Input
                aria-label="현재 페이지 제목"
                value={form.page_titles[page] || ""}
                placeholder="페이지 제목 (선택)"
                onChange={(e) => {
                  const titles = [...form.page_titles];
                  titles[page] = e.target.value;
                  change("page_titles", titles);
                }}
              />
              <span className="muted">
                {page + 1}/{form.pages.length}
              </span>
              <Tabs
                items={["작성", "미리보기", "분할 보기"]}
                value={mode}
                onChange={setMode}
              />
            </div>
            <div className="editor-toolbar">
              {toolbar.map(([label, value]) => (
                <Button
                  type="button"
                  title={label}
                  key={label}
                  onClick={() => tool(value)}
                >
                  {label}
                </Button>
              ))}
              <Button type="button" onClick={() => files.current?.click()}>
                파일 첨부
              </Button>
            </div>
            {mode === "분할 보기" && (
              <div className="mobile-editor-note">
                모바일에서는 작성 화면이 표시됩니다. 미리보기 탭으로 전환할 수
                있습니다.
              </div>
            )}
            <div
              className={`editor-panes ${mode === "분할 보기" ? "split" : ""}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files.length)
                  void upload(e.dataTransfer.files);
              }}
            >
              {mode !== "미리보기" && (
                <textarea
                  ref={text}
                  className="editor-text"
                  aria-label="Markdown 본문"
                  value={form.pages[page]}
                  spellCheck={false}
                  onChange={(e) => {
                    const pages = [...form.pages];
                    pages[page] = e.target.value;
                    change("pages", pages);
                  }}
                  onPaste={(e) => {
                    if (e.clipboardData.files.length) {
                      e.preventDefault();
                      void upload(e.clipboardData.files);
                    }
                  }}
                  placeholder="# 문제 분석\n\nMarkdown으로 기록하세요…"
                />
              )}
              {mode !== "작성" && (
                <div className="editor-preview">
                  <Markdown
                    content={form.pages[page] || "*아직 내용이 없습니다.*"}
                  />
                </div>
              )}
            </div>
          </Card>
          <div className="upload-zone">
            <p>
              이미지/PDF를 끌어 놓거나, 선택하거나, 에디터에 이미지를
              붙여넣으세요.
            </p>
            <label>
              이미지 대체 텍스트 (미입력 시 파일명)
              <Input
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                maxLength={200}
              />
            </label>
            <input
              ref={files}
              type="file"
              multiple
              aria-label="이미지 또는 PDF 선택"
              accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
              onChange={(e) => {
                if (e.target.files) void upload(e.target.files);
              }}
            />
            <small>PNG / JPG / WebP / GIF / PDF · 파일당 최대 10MB</small>
          </div>
        </fieldset>
        {progress && (
          <div role="status" className="notice">
            {progress}
            <progress aria-label="파일 업로드 진행" />
          </div>
        )}
        <div className="draft-bar">
          <Button
            type="submit"
            variant="primary"
            disabled={busy || uploading || !!draft || !categories.length}
          >
            {busy ? "저장 중…" : id ? "변경 사항 저장" : "Writeup 발행"}
          </Button>
          <small>첨부 파일은 공개 URL로 연결됩니다.</small>
        </div>
      </form>
      <Modal
        open={templateOpen}
        onClose={() => setTemplateOpen(false)}
        title="CTF Writeup 템플릿"
      >
        <p>현재 페이지 끝에 템플릿을 추가합니다. 기존 내용은 유지됩니다.</p>
        <Button
          onClick={() => {
            insert(template(form.category));
            setTemplateOpen(false);
          }}
        >
          현재 분야 템플릿 추가
        </Button>
      </Modal>
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="현재 페이지를 삭제할까요?"
      >
        <p>
          이 페이지의 내용이 사라집니다. 게시글을 저장하기 전에는 DB에 반영되지
          않습니다.
        </p>
        <Button
          variant="danger"
          onClick={() => {
            setForm((f) => ({
              ...f,
              pages: f.pages.filter((_, i) => i !== page),
              page_titles: f.pages
                .map((_, i) => f.page_titles[i] || "")
                .filter((_, i) => i !== page),
            }));
            setPage(Math.max(0, page - 1));
            setDeleteOpen(false);
          }}
        >
          페이지 삭제
        </Button>
      </Modal>
    </main>
  );
}
export default function Editor(props: { id?: string }) {
  return (
    <AdminGate>
      <EditorBody {...props} />
    </AdminGate>
  );
}
