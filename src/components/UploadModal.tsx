import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileText,
  X,
  Sparkles,
  Layers,
  Globe,
  Eye,
  CheckCircle2,
  AlertCircle,
  FilePlus2,
  ScanText,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { UploadedPDFFile } from "../types";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProcessFiles: (files: UploadedPDFFile[], targetLanguage: string) => Promise<void>;
  onLoadSample: (topic: string) => Promise<void>;
  isProcessing: boolean;
  processingStatus: string;
  errorMessage?: string | null;
  onClearError?: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onProcessFiles,
  onLoadSample,
  isProcessing,
  processingStatus,
  errorMessage,
  onClearError,
}) => {
  const [files, setFiles] = useState<UploadedPDFFile[]>([]);
  const [targetLanguage, setTargetLanguage] = useState("original");
  const [dragOver, setDragOver] = useState(false);
  const [isReadingFiles, setIsReadingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileSelection = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setIsReadingFiles(true);
    if (onClearError) onClearError();

    try {
      const readPromises: Promise<UploadedPDFFile>[] = [];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
          const promise = new Promise<UploadedPDFFile>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = (reader.result as string) || "";
              resolve({
                file,
                name: file.name,
                size: file.size,
                base64,
                status: "pending",
              });
            };
            reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
            reader.readAsDataURL(file);
          });
          readPromises.push(promise);
        }
      }

      const loaded = await Promise.all(readPromises);
      setFiles((prev) => [...prev, ...loaded]);
    } catch (err: any) {
      console.error("Error reading file:", err);
    } finally {
      setIsReadingFiles(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (files.length === 0 || isProcessing || isReadingFiles) return;
    await onProcessFiles(files, targetLanguage);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Upload PDFs to Wiki</h2>
              <p className="text-xs text-slate-400">
                Grounds all Obsidian notes in your uploaded PDF documents
              </p>
            </div>
          </div>
          {!isProcessing && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-5 space-y-5 pr-1">
          {/* Error Banner if something failed */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-950/70 border border-rose-600/60 text-xs text-rose-200 flex items-start gap-3 shadow-lg">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-rose-100">PDF Processing Error</div>
                <div className="text-rose-300 mt-1 font-mono break-all leading-relaxed">
                  {errorMessage}
                </div>
                <div className="mt-2 text-rose-400/90 text-[11px]">
                  Sample notes have been cleared so no placeholder data is confused with real documents. Please review and try again.
                </div>
              </div>
              <button
                onClick={() => onClearError && onClearError()}
                className="text-rose-400 hover:text-rose-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFileSelection(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
              dragOver
                ? "border-purple-400 bg-purple-950/30"
                : "border-slate-700 hover:border-slate-600 bg-slate-950/40 hover:bg-slate-950/70"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="application/pdf"
              className="hidden"
              onChange={(e) => handleFileSelection(e.target.files)}
            />
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-purple-400 mb-1">
                <FilePlus2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-200">
                Click to browse or drop PDF files here
              </p>
              <p className="text-xs text-slate-400 max-w-sm">
                Supports research papers, scanned guides, theses, books, and diagrams in any language
              </p>
              {isReadingFiles && (
                <div className="mt-2 flex items-center gap-2 text-xs text-purple-400 font-medium">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading PDF into memory...</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick OCR & Language Notice */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-start gap-2.5">
              <ScanText className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-200">Multimodal OCR & Layout Analysis</span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Gemini 3.8 Flash reads multi-column layouts, diagrams, tables, and scanned pages natively.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-start gap-2.5">
              <Globe className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold text-slate-200">Language Policy</span>
                <select
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  className="mt-1 w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:ring-1 focus:ring-purple-500 outline-none"
                >
                  <option value="original">Preserve Original Language(s)</option>
                  <option value="English">Standardize to English</option>
                  <option value="Spanish">Spanish (Español)</option>
                  <option value="French">French (Français)</option>
                  <option value="German">German (Deutsch)</option>
                  <option value="Japanese">Japanese (日本語)</option>
                  <option value="Chinese">Chinese (简体中文)</option>
                </select>
              </div>
            </div>
          </div>

          {/* File Queue */}
          {files.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>Selected Documents ({files.length})</span>
                {!isProcessing && (
                  <button
                    onClick={() => setFiles([])}
                    className="text-purple-400 hover:text-purple-300 text-[11px]"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {files.map((file, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-4 h-4 text-purple-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="truncate font-medium text-slate-200">
                          {file.name}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready for Gemini 3.8 Flash
                        </div>
                      </div>
                    </div>
                    {!isProcessing && (
                      <button
                        onClick={() => removeFile(idx)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instant Sample Presets */}
          <div className="pt-2 border-t border-slate-800/80">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Or Test With Knowledge Base Demos:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                disabled={isProcessing}
                onClick={() => onLoadSample("octopus_husbandry")}
                className="p-3 text-left rounded-lg bg-slate-950/70 hover:bg-cyan-950/30 border border-slate-800 hover:border-cyan-600/50 transition group flex items-start gap-2.5 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5 group-hover:scale-110 transition" />
                <div>
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300">
                    Octopus Husbandry & Cephalopod Biology
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Tank Escape Prevention, Water Quality, Feeding, Sensory Enrichment
                  </div>
                </div>
              </button>

              <button
                disabled={isProcessing}
                onClick={() => onLoadSample("neuro_memory")}
                className="p-3 text-left rounded-lg bg-slate-950/70 hover:bg-emerald-950/30 border border-slate-800 hover:border-emerald-600/50 transition group flex items-start gap-2.5 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 group-hover:scale-110 transition" />
                <div>
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-emerald-300">
                    Neural Mechanisms of Memory
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Synaptic Plasticity, Long-Term Potentiation, Hippocampal Engrams
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Live Processing Indicator */}
          {isProcessing && (
            <div className="p-4 rounded-xl bg-purple-950/50 border border-purple-500/60 space-y-2 text-center">
              <div className="flex items-center justify-center gap-2.5 text-purple-200 font-semibold text-xs">
                <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                <span>{processingStatus || "Processing document with Gemini 3.8 Flash..."}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Grounding concepts, generating Obsidian wikilinks, and synthesizing cross-references...
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            disabled={isProcessing}
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-white transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            disabled={isProcessing || isReadingFiles || files.length === 0}
            onClick={handleSubmit}
            className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-purple-900/40 transition disabled:opacity-50 active:scale-95"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Extracting Knowledge...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Process {files.length} PDF{files.length === 1 ? "" : "s"} with Gemini</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
