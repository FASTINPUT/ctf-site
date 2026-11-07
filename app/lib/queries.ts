import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { searchPattern } from "./content";
import type { PostSummary } from "./types";
const legacyFields = "id,title,category,created_at";
const summaryFields =
  legacyFields + ",updated_at,platform,difficulty,tags,status,solved_at";
function missingColumn(code: string) {
  return ["42703", "PGRST204"].includes(code);
}
// Summaries never include Markdown bodies. A legacy projection keeps reads available before migration.
export async function summaries(
  client: SupabaseClient = supabase,
): Promise<PostSummary[]> {
  const rows: PostSummary[] = [];
  let fields = summaryFields;
  for (let from = 0; ; from += 500) {
    const { data, error } = await client
      .from("posts")
      .select(fields)
      .order("id")
      .range(from, from + 499);
    if (error && fields !== legacyFields && missingColumn(error.code)) {
      fields = legacyFields;
      from -= 500;
      continue;
    }
    if (error)
      throw Error("목록을 불러오지 못했습니다. 연결과 읽기 권한을 확인하세요.");
    rows.push(...((data || []) as unknown as PostSummary[]));
    if (!data || data.length < 500) break;
  }
  return rows;
}
export type SearchOptions = {
  q?: string;
  category?: string;
  difficulty?: string;
  platform?: string;
  sort?: string;
  page: number;
  ids?: number[];
};
export async function searchPosts(
  options: SearchOptions,
  client: SupabaseClient = supabase,
) {
  async function execute(legacy = false) {
    let query = client
      .from("posts")
      .select(legacy ? legacyFields : summaryFields, { count: "exact" });
    if (options.category) query = query.eq("category", options.category);
    if (!legacy && options.difficulty)
      query = query.eq("difficulty", options.difficulty);
    if (!legacy && options.platform)
      query = query.eq("platform", options.platform);
    if (options.q?.trim()) {
      const pattern = searchPattern(options.q);
      query = query.or(`title.ilike.${pattern},content.ilike.${pattern}`);
    }
    if (options.ids) query = query.in("id", options.ids);
    const field =
      options.sort === "title"
        ? "title"
        : options.sort === "updated" && !legacy
          ? "updated_at"
          : "created_at";
    const page = Math.max(1, Math.floor(options.page) || 1);
    return query
      .order(field, {
        ascending: options.sort === "oldest" || options.sort === "title",
        nullsFirst: false,
      })
      .order("id", { ascending: false })
      .range((page - 1) * 12, page * 12 - 1);
  }
  let result = await execute();
  if (result.error && missingColumn(result.error.code))
    result = await execute(true);
  if (result.error)
    throw Error("게시글을 불러오지 못했습니다. 연결과 읽기 권한을 확인하세요.");
  return {
    posts: (result.data || []) as unknown as PostSummary[],
    count: result.count || 0,
  };
}
