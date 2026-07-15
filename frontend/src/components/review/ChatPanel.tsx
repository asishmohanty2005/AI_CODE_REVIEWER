import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { chatApi, getErrorMessage } from "@/services/api";
import type { ChatMessage } from "@/types";
import { cn } from "@/lib/utils";

const quickActions = [
  { label: "Explain functions", action: "explain_functions", prompt: "Explain every function and class." },
  { label: "Unit tests", action: "unit_tests", prompt: "Generate unit tests for this code." },
  { label: "Documentation", action: "documentation", prompt: "Generate documentation." },
  { label: "README", action: "readme", prompt: "Generate a README for this code." },
  { label: "Optimize", action: "optimize", prompt: "Optimize this code and explain changes." },
];

export function ChatPanel({ reviewId }: { reviewId: number }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const history = await chatApi.history(reviewId);
        if (mounted) setMessages(history);
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [reviewId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const send = async (content: string, action = "chat") => {
    if (!content.trim() || sending) return;
    setSending(true);
    setInput("");
    // Optimistic user bubble
    const tempId = Date.now();
    setMessages((m) => [
      ...m,
      {
        id: tempId,
        review_id: reviewId,
        role: "user",
        content,
        action,
        created_at: new Date().toISOString(),
      },
    ]);
    try {
      const reply = await chatApi.send(reviewId, { content, action });
      // Reload full history for accurate ids
      const history = await chatApi.history(reviewId);
      setMessages(history);
      if (!history.find((h) => h.id === reply.id)) {
        setMessages((m) => [...m, reply]);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
      setMessages((m) => m.filter((x) => x.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[560px] flex-col rounded-2xl border border-white/10 bg-card/50">
      <div className="border-b border-white/8 px-4 py-3">
        <h3 className="font-semibold text-white">AI Chat</h3>
        <p className="text-xs text-muted-foreground">
          Ask anything about this review or use a quick action
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5 border-b border-white/8 px-3 py-2">
        {quickActions.map((qa) => (
          <Button
            key={qa.action}
            size="sm"
            variant="ghost"
            className="h-7 text-[11px]"
            disabled={sending}
            onClick={() => send(qa.prompt, qa.action)}
          >
            {qa.label}
          </Button>
        ))}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {loading && (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        )}
        {!loading && messages.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No messages yet. Ask a question about the code.
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
              m.role === "user"
                ? "ml-auto bg-violet-600/80 text-white"
                : "mr-auto border border-white/10 bg-white/[0.04] text-slate-300"
            )}
          >
            <div className="prose-ai whitespace-pre-wrap">{m.content}</div>
          </div>
        ))}
        {sending && (
          <div className="mr-auto flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-muted-foreground">
            <Spinner className="h-4 w-4" /> Thinking...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        className="flex gap-2 border-t border-white/8 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about bugs, design, tests..."
          className="min-h-[44px] max-h-28 resize-none"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send(input);
            }
          }}
        />
        <Button type="submit" size="icon" disabled={sending || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
