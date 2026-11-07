export type Category = {
  id: number;
  name: string;
  slug: string;
  created_at?: string;
};
export type Post = {
  id: number;
  title: string;
  category: string;
  content: string;
  created_at: string;
  updated_at?: string | null;
  platform?: string | null;
  difficulty?: string | null;
  tags?: string[] | null;
  problem_url?: string | null;
  status?: string | null;
  solved_at?: string | null;
  page_titles?: string[] | null;
  file_url?: string | null;
};
export type PostSummary = Omit<Post, "content">;
