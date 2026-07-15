import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Search, Star, Trash2, History } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { getErrorMessage, reviewsApi } from "@/services/api";
import type { ReviewListItem } from "@/types";
import { SUPPORTED_LANGUAGES } from "@/types";
import { formatDateTime, languageLabel, scoreColor } from "@/lib/utils";

export default function HistoryPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [items, setItems] = useState<ReviewListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const page = Number(params.get("page") || 1);
  const q = params.get("q") || "";
  const language = params.get("language") || "";
  const favorites = params.get("favorites") === "1";
  const [search, setSearch] = useState(q);

  const load = async () => {
    setLoading(true);
    try {
      const data = await reviewsApi.list({
        page,
        page_size: 12,
        q: q || undefined,
        language: language || undefined,
        favorites_only: favorites || undefined,
      });
      setItems(data.items);
      setTotal(data.total);
      setPages(data.pages);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, q, language, favorites]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.set("page", "1");
    setParams(next);
  };

  const toggleFavorite = async (id: number) => {
    try {
      await reviewsApi.toggleFavorite(id);
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this review permanently?")) return;
    try {
      await reviewsApi.remove(id);
      toast.success("Review deleted");
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Review history</h1>
        <p className="mt-1 text-muted-foreground">
          {total} review{total === 1 ? "" : "s"} saved
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <form
          className="relative flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            updateParam("q", search.trim());
          }}
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Search title, filename, summary..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>
        <Select
          value={language}
          onChange={(e) => updateParam("language", e.target.value)}
          className="sm:w-44"
        >
          <option value="">All languages</option>
          {SUPPORTED_LANGUAGES.filter((l) => l.value !== "auto").map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </Select>
        <Button
          variant={favorites ? "default" : "outline"}
          onClick={() => updateParam("favorites", favorites ? "" : "1")}
        >
          <Star className="h-4 w-4" />
          Favorites
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={History}
          title="No reviews found"
          description="Try a different search or run a new AI review."
          actionLabel="New review"
          onAction={() => navigate("/review")}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((r) => (
            <Card key={r.id} className="group transition hover:border-violet-500/30">
              <CardContent className="flex h-full flex-col p-5">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <Badge variant="secondary">{languageLabel(r.language)}</Badge>
                  <span
                    className={`text-xl font-bold tabular-nums ${scoreColor(r.quality_score)}`}
                  >
                    {r.quality_score != null ? Math.round(r.quality_score) : "—"}
                  </span>
                </div>
                <Link
                  to={`/review/${r.id}`}
                  className="mb-1 line-clamp-1 font-semibold text-white hover:text-violet-300"
                >
                  {r.title}
                </Link>
                <p className="line-clamp-2 flex-1 text-sm text-muted-foreground">
                  {r.summary || "No summary available."}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(r.created_at)}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => toggleFavorite(r.id)}
                      aria-label="Favorite"
                    >
                      <Star
                        className={`h-4 w-4 ${
                          r.is_favorite
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground"
                        }`}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => remove(r.id)}
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-rose-400" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => updateParam("page", String(page - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pages}
            onClick={() => updateParam("page", String(page + 1))}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
