import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"));
  const limit = Math.min(50, parseInt(url.searchParams.get("limit") ?? "10"));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data: blueprints, count, error } = await supabase
    .from("blueprints")
    .select("id, title, idea_input, created_at, is_public", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ blueprints: blueprints ?? [], total: count ?? 0 });
}
