import React, { useState } from "react";
import {
  FileText,
  Copy,
  Check,
  Edit3,
  Eye,
  Link2,
  ExternalLink,
  BookOpen,
  Info,
  AlertTriangle,
  Lightbulb,
  Tag,
  ArrowRight,
} from "lucide-react";
import { DocumentAnalysisResult, ExtractedConcept } from "../types";

interface MarkdownViewerProps {
  currentPath: string;
  content: string;
  onContentChange: (newContent: string) => void;
  onNavigateToNote: (targetNoteName: string) => void;
  allConcepts: ExtractedConcept[];
  allDocuments: DocumentAnalysisResult[];
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  currentPath,
  content,
  onContentChange,
  onNavigateToNote,
  allConcepts,
  allDocuments,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Extract YAML frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  const rawFrontmatter = frontmatterMatch ? frontmatterMatch[1] : null;
  const bodyMarkdown = frontmatterMatch
    ? content.replace(/^---\n[\s\S]*?\n---\n*/, "")
    : content;

  // Extract Title from filename or heading
  const fileName = currentPath.split("/").pop()?.replace(/\.md$/, "") || "Note";

  // Find incoming backlinks for this note
  const backlinks = allConcepts
    .filter(
      (c) =>
        c.name.toLowerCase() !== fileName.toLowerCase() &&
        c.markdownContent.toLowerCase().includes(fileName.toLowerCase())
    )
    .map((c) => ({
      name: c.name,
      path: `wiki/Concepts/${c.name}.md`,
      summary: c.summary,
    }));

  // Parse wikilinks inside text
  const renderWikilinksText = (text: string) => {
    // Regex for [[Target]] or [[Target|Display]]
    const parts: React.ReactNode[] = [];
    const regex = /\[\[(.*?)\]\]/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      const rawInner = match[1];
      const [target, display] = rawInner.split("|");
      const cleanTarget = target.trim();
      const displayText = (display || target).trim();

      parts.push(
        <button
          key={`${cleanTarget}-${match.index}`}
          onClick={(e) => {
            e.stopPropagation();
            onNavigateToNote(cleanTarget);
          }}
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 mx-0.5 rounded text-purple-300 bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/30 hover:border-purple-400 font-medium transition text-[13px] group"
          title={`Open [[${cleanTarget}]]`}
        >
          <span className="text-purple-400 group-hover:text-purple-200">[[</span>
          <span className="underline decoration-purple-500/50 underline-offset-2">
            {displayText}
          </span>
          <span className="text-purple-400 group-hover:text-purple-200">]]</span>
        </button>
      );

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  };

  // Render markdown lines with Obsidian Callouts and headings
  const renderFormattedMarkdown = (markdown: string) => {
    const lines = markdown.split("\n");
    const elements: React.ReactNode[] = [];

    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let inCallout = false;
    let calloutType = "NOTE";
    let calloutTitle = "";
    let calloutLines: string[] = [];

    const flushCallout = (key: string) => {
      if (!inCallout) return;
      const getCalloutIcon = () => {
        switch (calloutType.toUpperCase()) {
          case "INFO":
            return <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />;
          case "WARNING":
            return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />;
          case "TIP":
            return <Lightbulb className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />;
          case "ABSTRACT":
            return <BookOpen className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />;
          default:
            return <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />;
        }
      };

      const getCalloutBorder = () => {
        switch (calloutType.toUpperCase()) {
          case "INFO":
            return "border-sky-500/40 bg-sky-950/20";
          case "WARNING":
            return "border-amber-500/40 bg-amber-950/20";
          case "TIP":
            return "border-emerald-500/40 bg-emerald-950/20";
          case "ABSTRACT":
            return "border-purple-500/40 bg-purple-950/20";
          default:
            return "border-indigo-500/40 bg-indigo-950/20";
        }
      };

      elements.push(
        <div
          key={`callout-${key}`}
          className={`my-4 p-3.5 rounded-lg border-l-4 border ${getCalloutBorder()} space-y-1.5`}
        >
          <div className="flex items-center gap-2 font-semibold text-sm text-slate-200">
            {getCalloutIcon()}
            <span>{calloutTitle || calloutType}</span>
          </div>
          <div className="text-sm text-slate-300 pl-6 leading-relaxed">
            {calloutLines.map((cl, i) => (
              <p key={i}>{renderWikilinksText(cl)}</p>
            ))}
          </div>
        </div>
      );

      inCallout = false;
      calloutLines = [];
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code blocks
      if (line.startsWith("```")) {
        if (inCodeBlock) {
          elements.push(
            <pre
              key={`code-${i}`}
              className="my-3 p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-purple-300 overflow-x-auto"
            >
              <code>{codeBlockContent.join("\n")}</code>
            </pre>
          );
          codeBlockContent = [];
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        continue;
      }

      // Obsidian Callout start: > [!NOTE] Title
      const calloutMatch = line.match(/^>\s*\[!([a-zA-Z]+)\]\s*(.*)/);
      if (calloutMatch) {
        flushCallout(`pre-${i}`);
        inCallout = true;
        calloutType = calloutMatch[1];
        calloutTitle = calloutMatch[2] || calloutMatch[1];
        continue;
      }

      if (inCallout) {
        if (line.startsWith(">")) {
          calloutLines.push(line.replace(/^>\s?/, ""));
          continue;
        } else {
          flushCallout(`end-${i}`);
        }
      }

      // Headings
      if (line.startsWith("# ")) {
        elements.push(
          <h1
            key={`h1-${i}`}
            className="text-2xl font-bold text-slate-100 mt-6 mb-3 pb-2 border-b border-slate-800 flex items-center gap-2"
          >
            {renderWikilinksText(line.replace(/^#\s+/, ""))}
          </h1>
        );
      } else if (line.startsWith("## ")) {
        elements.push(
          <h2
            key={`h2-${i}`}
            className="text-lg font-semibold text-purple-300 mt-5 mb-2.5 flex items-center gap-2"
          >
            {renderWikilinksText(line.replace(/^##\s+/, ""))}
          </h2>
        );
      } else if (line.startsWith("### ")) {
        elements.push(
          <h3
            key={`h3-${i}`}
            className="text-sm font-semibold text-slate-300 mt-4 mb-1.5 uppercase tracking-wider"
          >
            {renderWikilinksText(line.replace(/^###\s+/, ""))}
          </h3>
        );
      } else if (line.startsWith("---")) {
        elements.push(<hr key={`hr-${i}`} className="my-5 border-slate-800" />);
      } else if (line.startsWith("- ") || line.startsWith("* ")) {
        elements.push(
          <li
            key={`li-${i}`}
            className="text-sm text-slate-300 leading-relaxed ml-5 list-disc my-1"
          >
            {renderWikilinksText(line.replace(/^[-*]\s+/, ""))}
          </li>
        );
      } else if (line.trim().length > 0) {
        elements.push(
          <p
            key={`p-${i}`}
            className="text-sm text-slate-300 leading-relaxed my-2"
          >
            {renderWikilinksText(line)}
          </p>
        );
      } else {
        elements.push(<div key={`blank-${i}`} className="h-2" />);
      }
    }

    flushCallout("final");
    return elements;
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Top Header / Bar */}
      <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/70 backdrop-blur flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <FileText className="w-4 h-4 text-purple-400 shrink-0" />
          <span className="text-xs font-mono text-slate-400 truncate">
            {currentPath}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-2.5 py-1 text-xs rounded-md flex items-center gap-1.5 transition border ${
              isEditing
                ? "bg-purple-600 text-white border-purple-500 shadow-sm"
                : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
            }`}
          >
            {isEditing ? (
              <>
                <Eye className="w-3.5 h-3.5" /> Rendered
              </>
            ) : (
              <>
                <Edit3 className="w-3.5 h-3.5" /> Edit Markdown
              </>
            )}
          </button>

          <button
            onClick={handleCopy}
            className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Copy Note Markdown"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 font-sans">
        {isEditing ? (
          <div className="h-full flex flex-col">
            <div className="text-xs text-slate-400 mb-2 flex items-center gap-2">
              <span>Editing raw Obsidian Markdown (changes persist in memory & export):</span>
            </div>
            <textarea
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-200 resize-none focus:outline-none focus:ring-1 focus:ring-purple-500 leading-relaxed"
            />
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-4">
            {/* Obsidian YAML Frontmatter Card */}
            {rawFrontmatter && (
              <div className="mb-6 p-3.5 bg-slate-950/80 rounded-lg border border-slate-800/90 text-xs font-mono">
                <div className="text-[11px] uppercase tracking-wider text-purple-400 font-semibold mb-2 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" /> YAML Metadata
                </div>
                <div className="space-y-1 text-slate-400">
                  {rawFrontmatter.split("\n").map((line, idx) => {
                    if (!line.trim()) return null;
                    const [k, ...v] = line.split(":");
                    const val = v.join(":");
                    return (
                      <div key={idx} className="flex gap-2">
                        <span className="text-slate-500 select-none">{k}:</span>
                        <span className="text-slate-300 break-all">{val}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Rendered Markdown Body */}
            <article className="prose prose-invert max-w-none">
              {renderFormattedMarkdown(bodyMarkdown)}
            </article>

            {/* Obsidian Backlinks / Linked Mentions */}
            {backlinks.length > 0 && (
              <div className="mt-10 pt-6 border-t border-slate-800">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  <Link2 className="w-4 h-4 text-purple-400" />
                  <span>Linked Mentions ({backlinks.length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {backlinks.map((bl) => (
                    <button
                      key={bl.path}
                      onClick={() => onNavigateToNote(bl.name)}
                      className="text-left p-2.5 rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/50 transition group flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between text-xs font-medium text-purple-300 group-hover:text-purple-200">
                        <span>[[{bl.name}]]</span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition text-purple-400" />
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-1">
                        {bl.summary}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
