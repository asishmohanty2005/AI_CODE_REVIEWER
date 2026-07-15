import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Upload,
  Copy,
  Download,
  Star,
  Play,
  Languages,
  FileDown,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner, FullPageLoader } from "@/components/ui/spinner";
import { Tabs } from "@/components/ui/tabs";
import { CodeEditor } from "@/components/review/CodeEditor";
import { ReviewResults } from "@/components/review/ReviewResults";
import { ChatPanel } from "@/components/review/ChatPanel";
import { getErrorMessage, reviewsApi } from "@/services/api";
import type { Review } from "@/types";
import { SUPPORTED_LANGUAGES } from "@/types";
import {
  copyToClipboard,
  downloadBlob,
  languageLabel,
} from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const SAMPLE = `def fibonacci(n: int) -> list[int]:
    """Return the first n Fibonacci numbers."""
    if n <= 0:
        return []
    if n == 1:
        return [0]
    seq = [0, 1]
    while len(seq) < n:
        seq.append(seq[-1] + seq[-2])
    return seq


if __name__ == "__main__":
    print(fibonacci(10))
`;

export default function ReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("auto");
  const [code, setCode] = useState(SAMPLE);
  const [filename, setFilename] = useState<string | undefined>();
  const [provider, setProvider] = useState(user?.preferred_ai_provider || "gemini");
  const [submitting, setSubmitting] = useState(false);
  const [review, setReview] = useState<Review | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(!!id);
  const [panel, setPanel] = useState<"results" | "chat" | "compare" | "convert">(
    "results"
  );
  const [targetLang, setTargetLang] = useState("javascript");
  const [converted, setConverted] = useState("");
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      try {
        const r = await reviewsApi.get(Number(id));
        if (!mounted) return;
        setReview(r);
        setCode(r.source_code);
        setLanguage(r.language);
        setTitle(r.title);
        setFilename(r.filename || undefined);
        setProvider(r.ai_provider);
      } catch (err) {
        toast.error(getErrorMessage(err));
        navigate("/review");
      } finally {
        if (mounted) setLoadingExisting(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id, navigate]);

  const onFile = async (file: File) => {
    const text = await file.text();
    setCode(text);
    setFilename(file.name);
    if (!title) setTitle(file.name);
    // crude extension-based language
    const ext = file.name.split(".").pop()?.toLowerCase();
    const map: Record<string, string> = {
      py: "python",
      js: "javascript",
      ts: "typescript",
      java: "java",
      c: "c",
      cpp: "cpp",
      go: "go",
      rs: "rust",
      html: "html",
      css: "css",
      sql: "sql",
    };
    if (ext && map[ext]) setLanguage(map[ext]);
    toast.success(`Loaded ${file.name}`);
  };

  const submit = async () => {
    if (!code.trim()) {
      toast.error("Paste or upload some code first");
      return;
    }
    setSubmitting(true);
    try {
      const r = await reviewsApi.create({
        title: title || undefined,
        language,
        source_code: code,
        filename,
        ai_provider: provider,
      });
      toast.success("Review complete!");
      setReview(r);
      navigate(`/review/${r.id}`, { replace: true });
      setPanel("results");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleFavorite = async () => {
    if (!review) return;
    try {
      const r = await reviewsApi.toggleFavorite(review.id);
      setReview(r);
      toast.success(r.is_favorite ? "Added to favorites" : "Removed from favorites");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const exportPdf = async () => {
    if (!review) return;
    try {
      const blob = await reviewsApi.pdf(review.id);
      downloadBlob(blob, `codelens-review-${review.id}.pdf`);
      toast.success("PDF downloaded");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const runConvert = async () => {
    setConverting(true);
    try {
      const res = await reviewsApi.convert({
        source_code: code,
        source_language: language === "auto" ? "python" : language,
        target_language: targetLang,
        ai_provider: provider,
      });
      setConverted(res.converted_code);
      if (res.notes) toast.message(res.notes);
      setPanel("convert");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setConverting(false);
    }
  };

  if (loadingExisting) return <FullPageLoader label="Loading review..." />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {review ? review.title : "New code review"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {review
              ? `${languageLabel(review.language)} · Score ${
                  review.quality_score != null
                    ? Math.round(review.quality_score)
                    : "—"
                }`
              : "Paste code, pick a language, and let AI review it"}
          </p>
        </div>
        {review && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={toggleFavorite}>
              <Star
                className={`h-4 w-4 ${
                  review.is_favorite ? "fill-amber-400 text-amber-400" : ""
                }`}
              />
              Favorite
            </Button>
            <Button variant="outline" size="sm" onClick={exportPdf}>
              <FileDown className="h-4 w-4" />
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await copyToClipboard(review.source_code);
                toast.success("Source copied");
              }}
            >
              <Copy className="h-4 w-4" />
              Copy source
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Editor column */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Source</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Title</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Optional title"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Language</Label>
                  <Select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    {SUPPORTED_LANGUAGES.map((l) => (
                      <option key={l.value} value={l.value}>
                        {l.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>AI provider</Label>
                  <Select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                  >
                    <option value="gemini">Google Gemini</option>
                    <option value="openai">OpenAI</option>
                  </Select>
                </div>
                <div className="flex items-end gap-2">
                  <input
                    ref={fileRef}
                    type="file"
                    className="hidden"
                    accept=".py,.js,.jsx,.ts,.tsx,.java,.c,.cpp,.h,.hpp,.go,.rs,.html,.css,.sql,.txt"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void onFile(f);
                    }}
                  />
                  <Button
                    variant="outline"
                    className="flex-1"
                    type="button"
                    onClick={() => fileRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    Upload file
                  </Button>
                </div>
              </div>

              <CodeEditor
                value={code}
                onChange={setCode}
                language={language === "auto" ? "python" : language}
                height="420px"
              />

              <div className="flex flex-wrap gap-2">
                <Button onClick={submit} disabled={submitting} className="glow-primary">
                  {submitting ? (
                    <>
                      <Spinner className="h-4 w-4" /> Analyzing...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" /> Run AI review
                    </>
                  )}
                </Button>
                <Button
                  variant="secondary"
                  onClick={runConvert}
                  disabled={converting}
                >
                  {converting ? (
                    <Spinner className="h-4 w-4" />
                  ) : (
                    <Languages className="h-4 w-4" />
                  )}
                  Convert
                </Button>
                <Select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="w-36"
                >
                  {SUPPORTED_LANGUAGES.filter((l) => l.value !== "auto").map((l) => (
                    <option key={l.value} value={l.value}>
                      → {l.label}
                    </option>
                  ))}
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results column */}
        <div className="space-y-4">
          {review ? (
            <>
              <Tabs
                tabs={[
                  { id: "results", label: "Results" },
                  { id: "chat", label: "AI Chat" },
                  { id: "compare", label: "Compare" },
                  { id: "convert", label: "Converted" },
                ]}
                active={panel}
                onChange={(id) =>
                  setPanel(id as "results" | "chat" | "compare" | "convert")
                }
              />
              {panel === "results" && <ReviewResults review={review} />}
              {panel === "chat" && <ChatPanel reviewId={review.id} />}
              {panel === "compare" && (
                <div className="grid gap-3">
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                      Original
                    </h4>
                    <CodeEditor
                      value={review.source_code}
                      language={review.language}
                      readOnly
                      height="280px"
                    />
                  </div>
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                      Optimized / refactored
                    </h4>
                    <CodeEditor
                      value={
                        review.result?.refactored_code || review.source_code
                      }
                      language={review.language}
                      readOnly
                      height="280px"
                    />
                  </div>
                </div>
              )}
              {panel === "convert" && (
                <div className="space-y-3">
                  {!converted ? (
                    <p className="text-sm text-muted-foreground">
                      Use the Convert button to translate this code to another language.
                    </p>
                  ) : (
                    <>
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            await copyToClipboard(converted);
                            toast.success("Converted code copied");
                          }}
                        >
                          <Copy className="h-4 w-4" /> Copy
                        </Button>
                      </div>
                      <CodeEditor
                        value={converted}
                        language={targetLang}
                        readOnly
                        height="480px"
                      />
                    </>
                  )}
                </div>
              )}
            </>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex min-h-[420px] flex-col items-center justify-center p-8 text-center">
                <Download className="mb-4 h-10 w-10 text-violet-400/60" />
                <h3 className="text-lg font-semibold text-white">
                  Results appear here
                </h3>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  Run a review to see quality scores, bugs, security findings,
                  complexity analysis, refactored code, and more.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
