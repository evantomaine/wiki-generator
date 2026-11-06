export interface ExtractedConcept {
  id: string;
  name: string;
  aliases: string[];
  category: string;
  summary: string;
  markdownContent: string;
  suggestedTags: string[];
  relatedConceptNames: string[];
  sourceDocument: string;
  sourcePages?: string;
  language: string;
}

export interface DocumentAnalysisResult {
  fileName: string;
  docTitle: string;
  language: string;
  documentType: string;
  ocrDetected: boolean;
  pageCountEstimate?: number;
  summary: string;
  mainTopics: string[];
  concepts: ExtractedConcept[];
}

export interface CrossReferenceResult {
  homeMarkdown: string;
  relationships: Array<{
    sourceConcept: string;
    targetConcept: string;
    relationshipType: string;
  }>;
  tagsMap?: Array<{
    tag: string;
    concepts: string[];
  }>;
}

export interface UploadedPDFFile {
  file: File;
  name: string;
  size: number;
  base64: string;
  status: "pending" | "processing" | "completed" | "error";
  errorMessage?: string;
}

export type ProcessingStep =
  | "idle"
  | "reading_pdfs"
  | "ocr_multimodal_analysis"
  | "concept_extraction"
  | "cross_referencing"
  | "packaging_zip"
  | "completed";
