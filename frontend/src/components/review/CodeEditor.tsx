import Editor from "@monaco-editor/react";
import { MONACO_LANG_MAP } from "@/types";
import { Spinner } from "@/components/ui/spinner";

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  height?: string;
}

export function CodeEditor({
  value,
  onChange,
  language = "python",
  readOnly = false,
  height = "420px",
}: CodeEditorProps) {
  const monacoLang = MONACO_LANG_MAP[language] || "plaintext";

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0a0e18]">
      <Editor
        height={height}
        language={monacoLang}
        value={value}
        theme="vs-dark"
        onChange={(v) => onChange?.(v ?? "")}
        loading={
          <div className="flex h-full items-center justify-center">
            <Spinner />
          </div>
        }
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 13,
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: "on",
          padding: { top: 12, bottom: 12 },
          renderLineHighlight: "line",
          scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
        }}
      />
    </div>
  );
}
