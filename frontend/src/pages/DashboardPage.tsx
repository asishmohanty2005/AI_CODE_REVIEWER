import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import {
  Code2,
  Star,
  TrendingUp,
  Calendar,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { ScoreRing } from "@/components/common/ScoreRing";
import { useAuth } from "@/contexts/AuthContext";
import { getErrorMessage, reviewsApi, usersApi } from "@/services/api";
import type { ReviewListItem, UserStats } from "@/types";
import { formatDate, languageLabel, scoreColor } from "@/lib/utils";

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recent, setRecent] = useState<ReviewListItem[]>([]);
  const [favorites, setFavorites] = useState<ReviewListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [s, r, f] = await Promise.all([
          usersApi.stats(),
          reviewsApi.list({ page: 1, page_size: 5 }),
          reviewsApi.list({ page: 1, page_size: 5, favorites_only: true }),
        ]);
        if (!mounted) return;
        setStats(s);
        setRecent(r.items);
        setFavorites(f.items);
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const chartData = Object.entries(stats?.languages_used || {}).map(
    ([lang, count]) => ({
      language: languageLabel(lang),
      count,
    })
  );

  const colors = ["#8B5CF6", "#06B6D4", "#22C55E", "#F59E0B", "#EC4899", "#6366F1"];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Welcome back, {user?.full_name || user?.username}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Your AI review command center
          </p>
        </div>
        <Button onClick={() => navigate("/review")} className="glow-primary">
          <Sparkles className="h-4 w-4" />
          New review
        </Button>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Total reviews",
            value: stats?.total_reviews,
            icon: Code2,
            color: "text-violet-400",
          },
          {
            label: "Average AI score",
            value: stats ? stats.average_score.toFixed(1) : null,
            icon: TrendingUp,
            color: "text-cyan-400",
          },
          {
            label: "Favorites",
            value: stats?.favorite_reviews,
            icon: Star,
            color: "text-amber-400",
          },
          {
            label: "This week",
            value: stats?.reviews_this_week,
            icon: Calendar,
            color: "text-emerald-400",
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5">
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                {loading ? (
                  <Skeleton className="mt-1 h-7 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-white">{s.value ?? 0}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Languages reviewed</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : chartData.length === 0 ? (
              <EmptyState
                icon={Code2}
                title="No reviews yet"
                description="Run your first AI review to see language stats."
                actionLabel="Start reviewing"
                onAction={() => navigate("/review")}
                className="h-full border-0 bg-transparent py-8"
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                  <XAxis
                    dataKey="language"
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0f1424",
                      border: "1px solid rgba(148,163,184,0.15)",
                      borderRadius: 12,
                      color: "#f1f5f9",
                    }}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={colors[i % colors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Score snapshot */}
        <Card>
          <CardHeader>
            <CardTitle>Quality snapshot</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 py-6">
            <ScoreRing score={stats?.average_score ?? null} size={120} />
            <p className="text-center text-sm text-muted-foreground">
              Average quality across {stats?.total_reviews ?? 0} reviews
            </p>
            <div className="w-full space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>This month</span>
                <span className="text-white">{stats?.reviews_this_month ?? 0}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Plan</span>
                <Badge>{user?.plan || "free"}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent + favorites */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ReviewListCard
          title="Recent reviews"
          items={recent}
          loading={loading}
          emptyTitle="No recent reviews"
          linkTo="/history"
        />
        <ReviewListCard
          title="Favorites"
          items={favorites}
          loading={loading}
          emptyTitle="No favorites yet"
          linkTo="/history?favorites=1"
        />
      </div>
    </div>
  );
}

function ReviewListCard({
  title,
  items,
  loading,
  emptyTitle,
  linkTo,
}: {
  title: string;
  items: ReviewListItem[];
  loading: boolean;
  emptyTitle: string;
  linkTo: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Link
          to={linkTo}
          className="inline-flex items-center gap-1 text-xs text-violet-300 hover:text-violet-200"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading &&
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        {!loading && items.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">{emptyTitle}</p>
        )}
        {!loading &&
          items.map((r) => (
            <Link
              key={r.id}
              to={`/review/${r.id}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 transition hover:border-violet-500/30 hover:bg-white/[0.04]"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-white">{r.title}</p>
                <p className="text-xs text-muted-foreground">
                  {languageLabel(r.language)} · {formatDate(r.created_at)}
                </p>
              </div>
              <span className={`text-lg font-bold tabular-nums ${scoreColor(r.quality_score)}`}>
                {r.quality_score != null ? Math.round(r.quality_score) : "—"}
              </span>
            </Link>
          ))}
      </CardContent>
    </Card>
  );
}
