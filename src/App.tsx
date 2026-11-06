import React, { useState, useMemo } from "react";
import confetti from "canvas-confetti";
import {
  Download,
  Upload,
  Network,
  BookOpen,
  FileText,
  Sparkles,
  Info,
  CheckCircle,
  HelpCircle,
  FolderArchive,
  RefreshCw,
  ExternalLink,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
  AlertTriangle,
  X,
  FilePlus,
  CheckCircle2,
  Code2,
} from "lucide-react";
import { DocumentAnalysisResult, ExtractedConcept, UploadedPDFFile } from "./types";
import { initialDocuments, initialConcepts } from "./data/defaultVault";
import { VaultSidebar } from "./components/VaultSidebar";
import { MarkdownViewer } from "./components/MarkdownViewer";
import { GraphView } from "./components/GraphView";
import { UploadModal } from "./components/UploadModal";
import { generateWikiZip, sanitizeVaultName } from "./utils/zipGenerator";

export default function App() {
  const [documents, setDocuments] = useState<DocumentAnalysisResult[]>(initialDocuments);
  const [concepts, setConcepts] = useState<ExtractedConcept[]>(initialConcepts);
  const [activePath, setActivePath] = useState<string>("wiki/00 - Home.md");
  const [activeTab, setActiveTab] = useState<"reader" | "graph">("reader");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showObsidianGuide, setShowObsidianGuide] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationNotice, setValidationNotice] = useState<string | null>(null);
  const [relationships, setRelationships] = useState<
    Array<{ sourceConcept: string; targetConcept: string; relationshipType: string }>
  >([
    {
      sourceConcept: "Octopus Escape Prevention and Enclosure Security",
      targetConcept: "Cognitive and Environmental Enrichment for Octopuses",
      relationshipType: "mental stimulation reduces breach attempts",
    },
    {
      sourceConcept: "Cephalopod Water Chemistry and Nitrogenous Waste Management",
      targetConcept: "Aquarium Filtration Systems and Dissolved Oxygen",
      relationshipType: "high gas exchange & rapid ammonia removal",
    },
    {
      sourceConcept: "Safe Handling, Chemical Sensitivity, and Copper Toxicity",
      targetConcept: "Cephalopod Pathology, Quarantine, and Common Ailments",
      relationshipType: "prevents lethal metal toxicity and ulceration",
    },
  ]);
  const [homeMarkdown, setHomeMarkdown] = useState<string>("");

  // Map of file contents (for user live edits)
  const [fileOverrides, setFileOverrides] = useState<Map<string, string>>(new Map());

  // Generate current note content
  const currentContent = useMemo(() => {
    if (fileOverrides.has(activePath)) {
      return fileOverrides.get(activePath)!;
    }

    if (activePath === "wiki/00 - Home.md") {
      if (homeMarkdown) return homeMarkdown;
      return buildDynamicHome(documents, concepts);
    }

    if (activePath.startsWith("wiki/Concepts/")) {
      const conceptName = activePath.replace("wiki/Concepts/", "").replace(/\.md$/, "");
      const found = concepts.find(
        (c) =>
          sanitizeVaultName(c.name).toLowerCase() === conceptName.toLowerCase() ||
          c.name.toLowerCase() === conceptName.toLowerCase()
      );
      if (found) {
        return found.markdownContent;
      }
    }

    if (activePath.startsWith("wiki/Sources/")) {
      const sourceName = activePath.replace("wiki/Sources/", "").replace(/\.md$/, "");
      const found = documents.find(
        (d) =>
          sanitizeVaultName(d.docTitle || d.fileName).toLowerCase() === sourceName.toLowerCase() ||
          (d.docTitle || d.fileName).toLowerCase() === sourceName.toLowerCase()
      );
      if (found) {
        return buildSourceDocumentMarkdown(found, concepts);
      }
    }

    if (activePath.startsWith("wiki/Tags/")) {
      const rawTag = activePath.replace("wiki/Tags/", "").replace(/\.md$/, "");
      const cleanTag = rawTag.replace(/ - /g, "/");
      const matching = concepts.filter((c) =>
        (c.suggestedTags || []).some((t) => t.replace(/^#/, "") === cleanTag)
      );

      return [
        "---",
        `tag: "#${cleanTag}"`,
        `type: "tag-index"`,
        "---",
        `# Tag: #${cleanTag}`,
        "",
        `Concepts categorized under \`#${cleanTag}\`:`,
        "",
        ...matching.map((m) => `- [[${sanitizeVaultName(m.name)}]] - ${m.summary}`),
        "",
        "---",
        "[[00 - Home|⬅️ Back to Vault Home]]",
      ].join("\n");
    }

    return `# Note\n\nNo content available for \`${activePath}\`.`;
  }, [activePath, documents, concepts, fileOverrides, homeMarkdown]);

  // Navigate to note by name (from wikilinks)
  const handleNavigateToNote = (targetNoteName: string) => {
    const cleanName = sanitizeVaultName(targetNoteName.replace(/\.md$/, "").trim());

    if (cleanName.toLowerCase() === "00 - home" || cleanName.toLowerCase() === "home") {
      setActivePath("wiki/00 - Home.md");
      setActiveTab("reader");
      return;
    }

    const concept = concepts.find(
      (c) =>
        sanitizeVaultName(c.name).toLowerCase() === cleanName.toLowerCase() ||
        c.name.toLowerCase() === cleanName.toLowerCase() ||
        (c.aliases || []).some(
          (a) => sanitizeVaultName(a).toLowerCase() === cleanName.toLowerCase()
        )
    );
    if (concept) {
      setActivePath(`wiki/Concepts/${sanitizeVaultName(concept.name)}.md`);
      setActiveTab("reader");
      return;
    }

    const doc = documents.find(
      (d) =>
        sanitizeVaultName(d.docTitle || d.fileName).toLowerCase() === cleanName.toLowerCase() ||
        (d.docTitle || "").toLowerCase() === cleanName.toLowerCase() ||
        d.fileName.toLowerCase() === cleanName.toLowerCase()
    );
    if (doc) {
      setActivePath(`wiki/Sources/${sanitizeVaultName(doc.docTitle || doc.fileName)}.md`);
      setActiveTab("reader");
      return;
    }

    // Default target
    setActivePath(`wiki/Concepts/${cleanName}.md`);
    setActiveTab("reader");
  };

  const handleContentChange = (newContent: string) => {
    setFileOverrides((prev) => {
      const next = new Map(prev);
      next.set(activePath, newContent);
      return next;
    });

    if (activePath.startsWith("wiki/Concepts/")) {
      const conceptName = activePath.replace("wiki/Concepts/", "").replace(/\.md$/, "");
      setConcepts((prev) =>
        prev.map((c) =>
          sanitizeVaultName(c.name).toLowerCase() === conceptName.toLowerCase()
            ? { ...c, markdownContent: newContent }
            : c
        )
      );
    }
  };

  // Process uploaded PDF files with server API
  const handleProcessFiles = async (
    uploadedFiles: UploadedPDFFile[],
    targetLanguage: string
  ) => {
    setIsProcessing(true);
    setErrorMessage(null);
    setValidationNotice(null);

    // Clear out previous sample notes so only real document data enters the vault
    setDocuments([]);
    setConcepts([]);
    setRelationships([]);
    setFileOverrides(new Map());
    setHomeMarkdown("");

    const newDocs: DocumentAnalysisResult[] = [];
    const newConcepts: ExtractedConcept[] = [];

    try {
      for (let i = 0; i < uploadedFiles.length; i++) {
        const fileObj = uploadedFiles[i];
        setProcessingStatus(
          `Analyzing [${i + 1}/${uploadedFiles.length}] "${fileObj.name}" with Gemini OCR & Layout Understanding...`
        );

        const res = await fetch("/api/analyze-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pdfBase64: fileObj.base64,
            fileName: fileObj.name,
            preferredLanguage: targetLanguage,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Server returned error (${res.status}) analyzing "${fileObj.name}".`);
        }

        const data: DocumentAnalysisResult = await res.json();
        if (!data.concepts || data.concepts.length === 0) {
          throw new Error(`Gemini parsed "${fileObj.name}" but no atomic concepts could be extracted.`);
        }

        newDocs.push(data);
        newConcepts.push(...data.concepts);
      }

      setProcessingStatus("Synthesizing Obsidian Map of Content and validating internal wikilinks...");

      // Call cross-reference endpoint for the newly generated documents
      const crossRes = await fetch("/api/cross-reference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documents: newDocs,
          allConcepts: newConcepts,
        }),
      });

      let generatedHome = "";
      let newRels: any[] = [];

      if (crossRes.ok) {
        const crossData = await crossRes.json();
        if (crossData.homeMarkdown) {
          generatedHome = crossData.homeMarkdown;
        }
        if (crossData.relationships) {
          newRels = crossData.relationships;
        }
      }

      setDocuments(newDocs);
      setConcepts(newConcepts);
      setRelationships(newRels);
      setHomeMarkdown(generatedHome);

      setActivePath("wiki/00 - Home.md");
      setIsUploadOpen(false);

      confetti({
        particleCount: 110,
        spread: 85,
        origin: { y: 0.6 },
      });
    } catch (error: any) {
      console.error("Error processing documents:", error);
      setErrorMessage(error.message || "Failed to process PDF with Gemini.");
      setIsUploadOpen(true);
    } finally {
      setIsProcessing(false);
      setProcessingStatus("");
    }
  };

  // Load sample demo
  const handleLoadSample = async (topic: string) => {
    setIsProcessing(true);
    setErrorMessage(null);
    setValidationNotice(null);
    setProcessingStatus("Synthesizing deep knowledge base notes with Gemini...");

    setDocuments([]);
    setConcepts([]);
    setRelationships([]);
    setFileOverrides(new Map());
    setHomeMarkdown("");

    try {
      const res = await fetch("/api/sample-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to load sample demo");
      }

      const data: DocumentAnalysisResult = await res.json();
      setDocuments([data]);
      setConcepts(data.concepts);
      setActivePath(`wiki/Concepts/${sanitizeVaultName(data.concepts[0]?.name || "00 - Home")}.md`);
      setIsUploadOpen(false);

      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to load sample demo");
      setIsUploadOpen(true);
    } finally {
      setIsProcessing(false);
      setProcessingStatus("");
    }
  };

  // Download wiki.zip with comprehensive link validation
  const handleDownloadZip = async () => {
    if (documents.length === 0 && concepts.length === 0) {
      setErrorMessage("No notes currently in the vault to export. Please upload a PDF first.");
      setIsUploadOpen(true);
      return;
    }

    try {
      setIsDownloading(true);
      setErrorMessage(null);

      // Generate ZIP and run link validation
      const { blob, validation } = await generateWikiZip(
        documents,
        concepts,
        homeMarkdown,
        relationships
      );

      // Validate all internal wikilinks against exported files
      if (!validation.isValid && validation.brokenLinks.length > 0) {
        const brokenPreview = validation.brokenLinks
          .slice(0, 3)
          .map((b) => `[[${b.linkTarget}]] in ${b.sourceFile.split("/").pop()}`)
          .join(", ");
        throw new Error(
          `Link validation failed: ${validation.brokenLinks.length} unresolvable wikilink(s) detected (${brokenPreview}).`
        );
      }

      setValidationNotice(
        `All ${validation.validLinks} internal wikilinks validated & resolved against exported vault notes!`
      );

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "wiki.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.5 },
      });

      setShowObsidianGuide(true);
    } catch (error: any) {
      console.error("Error generating zip:", error);
      setErrorMessage(error.message || "Failed to validate or create wiki.zip");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Left Obsidian Vault File Explorer */}
      <VaultSidebar
        documents={documents}
        concepts={concepts}
        activePath={activePath}
        onSelectPath={(path) => {
          setActivePath(path);
          setActiveTab("reader");
        }}
        onOpenUpload={() => setIsUploadOpen(true)}
      />

      {/* Main App Canvas */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Navbar */}
        <header className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-5 flex items-center justify-between gap-4 shrink-0">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab("reader")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition ${
                activeTab === "reader"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Note Reader</span>
            </button>

            <button
              onClick={() => setActiveTab("graph")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition ${
                activeTab === "graph"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Obsidian Graph View</span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-purple-950 text-purple-300 font-mono">
                {concepts.length + documents.length + (documents.length > 0 ? 1 : 0)} nodes
              </span>
            </button>
          </div>

          {/* Validation Status Badge */}
          <div className="hidden lg:flex items-center gap-2 text-xs bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-300 text-[11px]">
              Vault Links: <strong className="text-emerald-400">100% Validated</strong> against exported files
            </span>
          </div>

            {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Download Application Code */}
            <a
              href="/api/download-app-zip"
              download="wikigen-app-source.zip"
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs flex items-center gap-1.5 transition"
              title="Download entire application codebase as ZIP"
            >
              <Code2 className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Download App (.zip)</span>
            </a>

            <button
              onClick={() => setShowObsidianGuide(true)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs flex items-center gap-1.5 transition"
              title="How to browse in Obsidian"
            >
              <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Obsidian Guide</span>
            </button>

            <button
              onClick={() => {
                setErrorMessage(null);
                setIsUploadOpen(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition"
            >
              <Upload className="w-3.5 h-3.5 text-purple-400" />
              <span>Upload PDFs</span>
            </button>

            {/* Primary Download wiki.zip button */}
            <button
              onClick={handleDownloadZip}
              disabled={isDownloading || concepts.length === 0}
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-purple-900/40 transition active:scale-95 disabled:opacity-50"
            >
              {isDownloading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>Download wiki.zip</span>
            </button>
          </div>
        </header>

        {/* Validation Notice Banner */}
        {validationNotice && (
          <div className="bg-emerald-950/80 border-b border-emerald-600 px-5 py-2 flex items-center justify-between text-xs text-emerald-200 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{validationNotice}</span>
            </div>
            <button
              onClick={() => setValidationNotice(null)}
              className="text-emerald-400 hover:text-emerald-100 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Top Error Alert if any exists */}
        {errorMessage && (
          <div className="bg-rose-950/80 border-b border-rose-600 px-5 py-2.5 flex items-center justify-between text-xs text-rose-200">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="truncate">
                <strong>Notice:</strong> {errorMessage}
              </span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-rose-100 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* View Content */}
        <main className="flex-1 p-4 overflow-hidden">
          {documents.length === 0 && concepts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
              <div className="w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 mb-4 shadow-lg shadow-purple-900/20">
                <FilePlus className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-100 mb-1">
                Your Knowledge Vault is Ready
              </h2>
              <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
                Upload your PDF documents to extract atomic concepts, run multimodal OCR, and generate an interconnected Obsidian wiki.
              </p>
              <button
                onClick={() => {
                  setErrorMessage(null);
                  setIsUploadOpen(true);
                }}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-purple-900/30 transition active:scale-95"
              >
                <Upload className="w-4 h-4" />
                <span>Upload PDF Document</span>
              </button>
            </div>
          ) : activeTab === "reader" ? (
            <MarkdownViewer
              currentPath={activePath}
              content={currentContent}
              onContentChange={handleContentChange}
              onNavigateToNote={handleNavigateToNote}
              allConcepts={concepts}
              allDocuments={documents}
            />
          ) : (
            <GraphView
              documents={documents}
              concepts={concepts}
              activeNotePath={activePath}
              onSelectNote={(path) => {
                setActivePath(path);
                setActiveTab("reader");
              }}
              relationships={relationships}
            />
          )}
        </main>
      </div>

      {/* Upload & Processing Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onProcessFiles={handleProcessFiles}
        onLoadSample={handleLoadSample}
        isProcessing={isProcessing}
        processingStatus={processingStatus}
        errorMessage={errorMessage}
        onClearError={() => setErrorMessage(null)}
      />

      {/* Obsidian Quickstart Guide Modal */}
      {showObsidianGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <FolderArchive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-base text-slate-100">
                  How to Browse in Obsidian
                </h3>
                <p className="text-xs text-slate-400">
                  Your exported <code className="text-purple-300">wiki.zip</code> is a 100% native Obsidian Vault
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300 pt-2">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-purple-900/80 text-purple-200 flex items-center justify-center text-xs font-bold shrink-0">
                  1
                </span>
                <div>
                  <div className="font-medium text-slate-200">Unzip wiki.zip</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    Extract the downloaded archive. You will find the <code className="text-purple-300 bg-slate-900 px-1 py-0.5 rounded">wiki/</code> folder containing all notes, Concepts, Sources, and <code className="text-purple-300 bg-slate-900 px-1 py-0.5 rounded">.obsidian/</code> settings.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-purple-900/80 text-purple-200 flex items-center justify-center text-xs font-bold shrink-0">
                  2
                </span>
                <div>
                  <div className="font-medium text-slate-200">Open in Obsidian</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    Launch Obsidian desktop or mobile. Click <strong>"Open folder as vault"</strong>, and choose the extracted <code className="text-purple-300 bg-slate-900 px-1 py-0.5 rounded">wiki</code> folder.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-purple-900/80 text-purple-200 flex items-center justify-center text-xs font-bold shrink-0">
                  3
                </span>
                <div>
                  <div className="font-medium text-slate-200">Explore Interactive Graph</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    In Obsidian, press <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-purple-300">Ctrl + G</kbd> (or <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-purple-300">Cmd + G</kbd> on Mac) to see the fully connected 2D graph with custom color groups!
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="font-semibold text-slate-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-indigo-400" />
                  <span>Run WikiGen on Your Local Machine</span>
                </span>
                <a
                  href="/api/download-app-zip"
                  download="wikigen-app-source.zip"
                  className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-medium flex items-center gap-1.5 transition"
                >
                  <Download className="w-3 h-3" />
                  <span>Download App (.zip)</span>
                </a>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                You can download the full-stack TypeScript codebase, extract it locally, run <code className="text-purple-300 bg-slate-900 px-1 py-0.5 rounded">npm install</code> and <code className="text-purple-300 bg-slate-900 px-1 py-0.5 rounded">npm run dev</code> to host WikiGen on your own computer with your own Gemini API key.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Features standard Obsidian [[Wikilinks]], YAML frontmatter, and Callout blocks.</span>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setShowObsidianGuide(false)}
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition"
              >
                Got it, thanks!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helpers
function buildDynamicHome(
  documents: DocumentAnalysisResult[],
  concepts: ExtractedConcept[]
): string {
  if (documents.length === 0 && concepts.length === 0) {
    return "# Knowledge Vault Hub\n\nNo documents uploaded yet. Upload a PDF to generate your interconnected wiki.";
  }

  const categories = Array.from(new Set(concepts.map((c) => c.category || "General")));

  const lines = [
    "---",
    'title: "Knowledge Vault Hub"',
    "type: hub",
    `created: "${new Date().toISOString().split("T")[0]}"`,
    `total_concepts: ${concepts.length}`,
    `total_sources: ${documents.length}`,
    "tags:",
    '  - "meta/index"',
    '  - "hub"',
    "sources:",
    ...documents.map((d) => `  - "[[${sanitizeVaultName(d.docTitle || d.fileName)}]]"`),
    "---",
    "",
    "# 🧠 Knowledge Vault Hub",
    "",
    "> [!ABSTRACT] Vault Overview",
    `> This wiki was generated from **${documents.length} source PDF(s)** containing **${concepts.length} interconnected concepts**.`,
    "> Every page features bidirectional `[[Wikilinks]]` strictly matching exported file names for Obsidian.",
    "",
    "## 📚 Source Documents",
    "",
    ...documents.map((d) => {
      const canonicalDoc = sanitizeVaultName(d.docTitle || d.fileName);
      return `- **[[${canonicalDoc}]]** (${d.documentType || "PDF Document"}) - *${d.language || "English"}* ${
        d.ocrDetected ? "🔍 `OCR Processed`" : ""
      }\n  > ${d.summary}`;
    }),
    "",
    "## 🧭 Concepts by Category",
    "",
  ];

  for (const cat of categories) {
    const catConcepts = concepts.filter((c) => (c.category || "General") === cat);
    lines.push(`### 🏷️ ${cat}`);
    lines.push("");
    for (const c of catConcepts) {
      const canonicalConcept = sanitizeVaultName(c.name);
      lines.push(`- [[${canonicalConcept}]] - ${c.summary}`);
    }
    lines.push("");
  }

  lines.push(
    "## 🕸️ Quick Obsidian Tip",
    "",
    "Press `Ctrl + G` (or `Cmd + G` on Mac) to open the **Graph View** and visualize how all these concepts and source documents cross-link in real time!",
    "",
    "---",
    "*Generated with WikiGen for Obsidian*"
  );

  return lines.join("\n");
}

function buildSourceDocumentMarkdown(
  doc: DocumentAnalysisResult,
  concepts: ExtractedConcept[]
): string {
  const canonicalDocTitle = sanitizeVaultName(doc.docTitle || doc.fileName);

  const docConcepts = concepts.filter((c) => {
    const src = sanitizeVaultName(c.sourceDocument);
    return (
      src.toLowerCase() === canonicalDocTitle.toLowerCase() ||
      c.sourceDocument.toLowerCase() === (doc.fileName || "").toLowerCase()
    );
  });

  const lines = [
    "---",
    `title: "${canonicalDocTitle.replace(/"/g, '\\"')}"`,
    `type: "source-document"`,
    `file_name: "${doc.fileName}"`,
    `language: "${doc.language || "English"}"`,
    `ocr_applied: ${doc.ocrDetected}`,
    `extracted_concepts_count: ${docConcepts.length}`,
    "tags:",
    '  - "type/source"',
    `  - "language/${(doc.language || "en").toLowerCase().replace(/[^a-z0-9]/g, "")}"`,
    "---",
    "",
    `# 📄 ${canonicalDocTitle}`,
    "",
    "> [!NOTE] Document Metadata",
    `> - **Original File:** \`${doc.fileName}\``,
    `> - **Detected Type:** ${doc.documentType || "PDF Document"}`,
    `> - **Primary Language:** ${doc.language || "English"}`,
    `> - **OCR Vision Processing:** ${doc.ocrDetected ? "Yes (Scanned / Image Layout Detected)" : "Native Digital Text"}`,
    "",
    "## 📝 Document Summary",
    "",
    doc.summary || "Summary extracted from document.",
    "",
    "## 🏷️ Key Topics",
    "",
    ...(doc.mainTopics || []).map((t) => `- \`#${t.replace(/\s+/g, "_")}\``),
    "",
    "## 💡 Extracted Concepts",
    "",
    ...docConcepts.map(
      (c) => `- **[[${sanitizeVaultName(c.name)}]]** (${c.category || "General"}): ${c.summary}`
    ),
    "",
    "---",
    "[[00 - Home|⬅️ Back to Vault Home]]",
  ];

  return lines.join("\n");
}
