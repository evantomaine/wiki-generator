import React, { useState } from "react";
import {
  Folder,
  FolderOpen,
  FileText,
  Search,
  BookOpen,
  Sparkles,
  PlusCircle,
  Hash,
  ChevronDown,
  ChevronRight,
  Database,
  Globe2,
} from "lucide-react";
import { DocumentAnalysisResult, ExtractedConcept } from "../types";
import { sanitizeVaultName } from "../utils/zipGenerator";

interface VaultSidebarProps {
  documents: DocumentAnalysisResult[];
  concepts: ExtractedConcept[];
  activePath: string;
  onSelectPath: (path: string) => void;
  onOpenUpload: () => void;
  tagsMap?: Array<{ tag: string; concepts: string[] }>;
}

export const VaultSidebar: React.FC<VaultSidebarProps> = ({
  documents,
  concepts,
  activePath,
  onSelectPath,
  onOpenUpload,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<{ [key: string]: boolean }>({
    concepts: true,
    sources: true,
    tags: false,
  });

  const toggleFolder = (key: string) => {
    setExpandedFolders((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Filtered concepts
  const filteredConcepts = concepts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.suggestedTags || []).some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Filtered sources
  const filteredSources = documents.filter(
    (d) =>
      (d.docTitle || d.fileName).toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Unique tags
  const allTags = Array.from(
    new Set(concepts.flatMap((c) => c.suggestedTags || []).map((t) => t.replace(/^#/, "")))
  );

  return (
    <aside className="w-72 bg-slate-950 border-r border-slate-800 flex flex-col h-full select-none text-slate-300">
      {/* Brand & Vault Title */}
      <div className="p-4 border-b border-slate-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-900/30">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-sm text-slate-100 tracking-tight flex items-center gap-1.5">
                WikiGen <span className="text-[10px] bg-purple-950 border border-purple-800/60 text-purple-300 px-1.5 py-0.2 rounded">Obsidian</span>
              </h1>
              <p className="text-[11px] text-slate-400">PDF to Markdown Vault</p>
            </div>
          </div>
        </div>

        {/* Quick Upload Action */}
        <button
          onClick={onOpenUpload}
          className="w-full mt-3 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.98]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Upload New PDFs</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-slate-800/60">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search notes, concepts, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-md text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 text-xs">
        {/* Vault Root Directory Header */}
        <div className="px-2 py-1 flex items-center gap-1.5 text-slate-400 font-medium text-[11px] uppercase tracking-wider">
          <Database className="w-3.5 h-3.5 text-purple-400" />
          <span>wiki/</span>
        </div>

        {/* 00 - Home Note */}
        <button
          onClick={() => onSelectPath("wiki/00 - Home.md")}
          className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center gap-2 transition ${
            activePath === "wiki/00 - Home.md"
              ? "bg-purple-900/40 text-purple-200 border border-purple-700/50"
              : "hover:bg-slate-900 text-slate-300"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="truncate font-medium">00 - Home.md</span>
        </button>

        {/* Concepts Folder */}
        <div>
          <button
            onClick={() => toggleFolder("concepts")}
            className="w-full text-left px-2 py-1.5 rounded-md flex items-center justify-between text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 transition font-medium text-[11px]"
          >
            <div className="flex items-center gap-1.5">
              {expandedFolders.concepts ? (
                <ChevronDown className="w-3 h-3 text-slate-500" />
              ) : (
                <ChevronRight className="w-3 h-3 text-slate-500" />
              )}
              {expandedFolders.concepts ? (
                <FolderOpen className="w-3.5 h-3.5 text-purple-400" />
              ) : (
                <Folder className="w-3.5 h-3.5 text-purple-400" />
              )}
              <span>Concepts</span>
            </div>
            <span className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-500 font-mono">
              {filteredConcepts.length}
            </span>
          </button>

          {expandedFolders.concepts && (
            <div className="ml-4 pl-2 border-l border-slate-800/80 space-y-0.5 mt-0.5">
              {filteredConcepts.length === 0 ? (
                <div className="px-2 py-1 text-[11px] text-slate-600 italic">
                  No concepts match
                </div>
              ) : (
                filteredConcepts.map((concept) => {
                  const path = `wiki/Concepts/${sanitizeVaultName(concept.name)}.md`;
                  const isSelected = activePath === path;
                  return (
                    <button
                      key={concept.id}
                      onClick={() => onSelectPath(path)}
                      className={`w-full text-left px-2 py-1 rounded text-xs flex items-center gap-2 transition truncate ${
                        isSelected
                          ? "bg-purple-900/50 text-purple-200 border border-purple-600/40"
                          : "hover:bg-slate-900 text-slate-300"
                      }`}
                    >
                      <FileText className="w-3 h-3 text-purple-400/80 shrink-0" />
                      <span className="truncate">{concept.name}</span>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Sources Folder */}
        <div>
          <button
            onClick={() => toggleFolder("sources")}
            className="w-full text-left px-2 py-1.5 rounded-md flex items-center justify-between text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 transition font-medium text-[11px]"
          >
            <div className="flex items-center gap-1.5">
              {expandedFolders.sources ? (
                <ChevronDown className="w-3 h-3 text-slate-500" />
              ) : (
                <ChevronRight className="w-3 h-3 text-slate-500" />
              )}
              {expandedFolders.sources ? (
                <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Folder className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>Sources</span>
            </div>
            <span className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-500 font-mono">
              {filteredSources.length}
            </span>
          </button>

          {expandedFolders.sources && (
            <div className="ml-4 pl-2 border-l border-slate-800/80 space-y-0.5 mt-0.5">
              {filteredSources.map((doc) => {
                const canonicalName = sanitizeVaultName(doc.docTitle || doc.fileName);
                const path = `wiki/Sources/${canonicalName}.md`;
                const isSelected = activePath === path;
                return (
                  <button
                    key={doc.fileName}
                    onClick={() => onSelectPath(path)}
                    className={`w-full text-left px-2 py-1 rounded text-xs flex items-center gap-2 transition truncate ${
                      isSelected
                        ? "bg-emerald-950/60 text-emerald-200 border border-emerald-600/40"
                        : "hover:bg-slate-900 text-slate-300"
                    }`}
                  >
                    <FileText className="w-3 h-3 text-emerald-400/80 shrink-0" />
                    <span className="truncate">{doc.docTitle || doc.fileName}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Tags Folder */}
        {allTags.length > 0 && (
          <div>
            <button
              onClick={() => toggleFolder("tags")}
              className="w-full text-left px-2 py-1.5 rounded-md flex items-center justify-between text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 transition font-medium text-[11px]"
            >
              <div className="flex items-center gap-1.5">
                {expandedFolders.tags ? (
                  <ChevronDown className="w-3 h-3 text-slate-500" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-slate-500" />
                )}
                {expandedFolders.tags ? (
                  <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Folder className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>Tags</span>
              </div>
              <span className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-500 font-mono">
                {allTags.length}
              </span>
            </button>

            {expandedFolders.tags && (
              <div className="ml-4 pl-2 border-l border-slate-800/80 space-y-0.5 mt-0.5">
                {allTags.slice(0, 15).map((tag) => {
                  const tagFilename = tag.replace(/\//g, " - ");
                  const path = `wiki/Tags/${tagFilename}.md`;
                  const isSelected = activePath === path;
                  return (
                    <button
                      key={tag}
                      onClick={() => onSelectPath(path)}
                      className={`w-full text-left px-2 py-1 rounded text-xs flex items-center gap-1.5 transition truncate ${
                        isSelected
                          ? "bg-amber-950/60 text-amber-200 border border-amber-600/40"
                          : "hover:bg-slate-900 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <Hash className="w-3 h-3 text-amber-400/70 shrink-0" />
                      <span className="truncate">#{tag}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Vault Stats Footer */}
      <div className="p-3 bg-slate-900/50 border-t border-slate-800/70 text-[11px] text-slate-500 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe2 className="w-3.5 h-3.5 text-slate-400" />
          <span>{concepts.length} concepts</span>
        </div>
        <span>{documents.length} docs</span>
      </div>
    </aside>
  );
};
