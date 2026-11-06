import express, { Request, Response } from "express";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// High body limit to support multi-page and high-res scanned PDFs up to 100MB
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

// Initialize Google Gen AI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

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

/**
 * Robust JSON parsing with fallback cleanup
 */
function cleanAndParseJson(rawText: string): any {
  if (!rawText || !rawText.trim()) {
    throw new Error("Model returned empty response text");
  }

  let text = rawText.trim();

  // Strip markdown code fences if model wrapped response in ```json ... ```
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }

  try {
    return JSON.parse(text);
  } catch (err: any) {
    console.warn("Direct JSON.parse failed, attempting substring recovery:", err.message);
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const candidate = text.substring(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(candidate);
      } catch (err2) {
        // continue
      }
    }
    throw new Error(`Failed to parse model JSON: ${err.message}. Response preview: ${text.slice(0, 200)}...`);
  }
}

/**
 * Resilient Gemini caller that handles 503 high demand or temporary model outages
 * by falling back between active models (gemini-3.8-flash -> gemini-3.1-flash-lite).
 */
async function callGeminiWithResilience(params: {
  contents: any;
  systemInstruction?: string;
  responseSchema?: any;
}): Promise<any> {
  const models = ["gemini-3.1-flash-lite", "gemini-3.8-flash"];
  let lastError: any = null;

  for (const model of models) {
    try {
      console.log(`[Gemini] Attempting call with model "${model}"...`);
      const config: any = {
        responseMimeType: "application/json",
      };

      if (params.systemInstruction) {
        config.systemInstruction = params.systemInstruction;
      }
      if (params.responseSchema) {
        config.responseSchema = params.responseSchema;
      }

      // ThinkingLevel is only supported on gemini-3.8-flash
      if (model === "gemini-3.8-flash") {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
      }

      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config,
      });

      console.log(`[Gemini] Model "${model}" completed successfully!`);
      return response;
    } catch (err: any) {
      console.warn(`[Gemini] Model "${model}" error:`, err?.status || err?.code, err?.message);
      lastError = err;

      // If it's a permanent client-side bad argument (not 503, 429, or 500), don't retry
      if (err.status && err.status >= 400 && err.status < 500 && err.status !== 429) {
        throw err;
      }
    }
  }

  throw lastError;
}

// 1. Endpoint: Analyze a PDF document
app.post("/api/analyze-pdf", async (req: Request, res: Response) => {
  console.log(`[POST /api/analyze-pdf] Incoming request for file: "${req.body.fileName}"`);

  try {
    const { pdfBase64, fileName, preferredLanguage } = req.body;

    if (!pdfBase64) {
      return res.status(400).json({ error: "Missing pdfBase64 data in request body" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured in the server environment.",
      });
    }

    // Clean base64 string: reliably strip ANY data URL scheme
    const cleanBase64 = pdfBase64.includes(",")
      ? pdfBase64.split(",")[1].trim()
      : pdfBase64.trim();

    if (!cleanBase64) {
      return res.status(400).json({ error: "Provided PDF base64 is empty after decoding." });
    }

    console.log(`[POST /api/analyze-pdf] Base64 size: ~${Math.round((cleanBase64.length * 3) / 4 / 1024)} KB`);

    const systemPrompt = `You are an expert research scholar, domain knowledge architect, and Obsidian wiki specialist.
Your task is to analyze the provided PDF document ("${fileName || "Uploaded Document.pdf"}").
The document may be an aquarium husbandry guide, marine biology manual, thesis, research paper, or scanned report.
It may contain text, photographs, anatomy schemas, water parameters, plumbing setups, and diagrams.

Instructions:
1. Ground all extracted knowledge strictly and faithfully in this document. Never substitute with unrelated placeholder or sample topics.
2. Handle all visual layouts, diagrams, tables, and scanned/image text transparently via multimodal comprehension and OCR.
3. Identify the true document title, primary language, and high-level summary.
4. Extract 6 to 10 core, atomic concepts that are central to this document.
   - For example, for an octopus husbandry guide, extract concepts like:
     * Octopus Escape Prevention & Lid Securing
     * Water Quality & Nitrogen Cycle for Cephalopods
     * Cephalopod Nutrition & Feeding Protocol
     * Environmental Enrichment & Problem-Solving
     * Senescence & Life-Cycle Management
     * Common Pathologies & Quarantine Protocols
     * Aquarium Substrate & Lighting Requirements
5. For each concept:
   - Provide a clean, canonical 'name' that makes a great Obsidian note title (avoid illegal characters).
   - Write thorough 'markdownContent' formatted for Obsidian:
     * YAML frontmatter (title, aliases, tags, source_document, related).
     * Obsidian Callout block (> [!INFO] or > [!WARNING] or > [!TIP] or > [!ABSTRACT]) summarizing the core guideline.
     * Clear Markdown headings: ## Overview, ## Critical Requirements & Guidelines, ## Implementation & Methodologies, ## Pitfalls & Special Precautions.
     * Proactively cross-reference other concepts using Obsidian wikilinks: [[Concept Name]].
   - Provide a 1-2 sentence summary, aliases, tags (e.g. #aquarium/husbandry, #biology/cephalopods), and related concept names.`;

    const userPrompt = `Please read the attached PDF document ("${fileName || "Uploaded Document.pdf"}") thoroughly from start to finish.
Extract the fundamental concepts, practices, mechanisms, or principles documented in it. Format as an Obsidian-compatible knowledge base with cross-referenced [[Wikilinks]].`;

    const response = await callGeminiWithResilience({
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: "application/pdf",
                data: cleanBase64,
              },
            },
            {
              text: userPrompt,
            },
          ],
        },
      ],
      systemInstruction: systemPrompt,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          fileName: { type: Type.STRING },
          docTitle: { type: Type.STRING, description: "True title of the document" },
          language: { type: Type.STRING, description: "Detected language (e.g. English)" },
          documentType: { type: Type.STRING, description: "e.g. Husbandry Guide, Research Thesis, Manual" },
          ocrDetected: { type: Type.BOOLEAN, description: "True if scanned pages, diagrams, or visual elements were processed" },
          summary: { type: Type.STRING, description: "High-level summary of the entire document" },
          mainTopics: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "4 to 7 main topical themes",
          },
          concepts: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Canonical title of the concept (valid filename)" },
                aliases: { type: Type.ARRAY, items: { type: Type.STRING } },
                category: { type: Type.STRING, description: "Broad domain or sub-area" },
                summary: { type: Type.STRING, description: "1-2 sentence quick summary" },
                markdownContent: {
                  type: Type.STRING,
                  description: "Complete Obsidian-ready markdown with frontmatter, headings, callout, and [[Wikilinks]]",
                },
                suggestedTags: { type: Type.ARRAY, items: { type: Type.STRING } },
                relatedConceptNames: { type: Type.ARRAY, items: { type: Type.STRING } },
                sourcePages: { type: Type.STRING, description: "Relevant sections or page references" },
              },
              required: ["name", "summary", "markdownContent", "category"],
            },
          },
        },
        required: ["docTitle", "language", "documentType", "ocrDetected", "summary", "mainTopics", "concepts"],
      },
    });

    const rawText = response.text || "{}";
    const parsedData = cleanAndParseJson(rawText);
    const rawDocTitle = parsedData.docTitle || fileName.replace(/\.pdf$/i, "").replace(/[-_]/g, " ");
    const docTitle = rawDocTitle
      .replace(/[/\\?%*:|"<>#^]/g, "-")
      .replace(/\s*-\s*/g, "- ")
      .trim();

    const result: DocumentAnalysisResult = {
      fileName: fileName || "document.pdf",
      docTitle: docTitle,
      language: parsedData.language || "English",
      documentType: parsedData.documentType || "PDF Document",
      ocrDetected: Boolean(parsedData.ocrDetected),
      summary: parsedData.summary || "Summary extracted from document.",
      mainTopics: parsedData.mainTopics || [],
      concepts: (parsedData.concepts || []).map((c: any, idx: number) => {
        const cleanName = (c.name || `Concept ${idx + 1}`)
          .replace(/[/\\?%*:|"<>#^]/g, "-")
          .replace(/\s*-\s*/g, "- ")
          .trim();
        return {
          id: `${fileName}-c${idx + 1}-${Date.now()}`,
          name: cleanName,
          aliases: (c.aliases || []).map((a: string) => a.replace(/[/\\?%*:|"<>#^]/g, "-").trim()),
          category: c.category || "General",
          summary: c.summary || "",
          markdownContent: c.markdownContent || `# ${cleanName}\n\n${c.summary}`,
          suggestedTags: c.suggestedTags || [],
          relatedConceptNames: (c.relatedConceptNames || []).map((r: string) =>
            r.replace(/[/\\?%*:|"<>#^]/g, "-").trim()
          ),
          sourceDocument: docTitle,
          sourcePages: c.sourcePages || "Reference Section",
          language: parsedData.language || "English",
        };
      }),
    };

    console.log(`[POST /api/analyze-pdf] Successfully extracted ${result.concepts.length} concepts for "${docTitle}"`);
    res.json(result);
  } catch (error: any) {
    console.error("[POST /api/analyze-pdf] Error:", error);
    res.status(500).json({
      error: error?.message || "Failed to process PDF with Gemini API",
    });
  }
});

// 2. Endpoint: Cross-Reference & Build Obsidian Master Index
app.post("/api/cross-reference", async (req: Request, res: Response) => {
  console.log(`[POST /api/cross-reference] Processing cross-references`);

  try {
    const { documents, allConcepts } = req.body;

    if (!allConcepts || !Array.isArray(allConcepts) || allConcepts.length === 0) {
      return res.status(400).json({ error: "Missing or invalid allConcepts array" });
    }

    const conceptNames = allConcepts.map((c: any) => c.name);
    const docSummaries = (documents || []).map((d: any) => ({
      title: d.docTitle,
      topics: d.mainTopics,
      summary: d.summary,
    }));

    const prompt = `You are an expert Obsidian vault architect.
We have compiled an Obsidian knowledge vault containing ${allConcepts.length} concepts from the following source document(s):
Documents: ${JSON.stringify(docSummaries)}
Concept Names: ${JSON.stringify(conceptNames)}

Tasks:
1. Create a master '00 - Home.md' note for Obsidian that serves as the entry point/dashboard for this specific vault.
   - Include YAML frontmatter.
   - Include a comprehensive Map of Content (MOC) grouping these concepts logically into thematic sections.
   - Use Obsidian [[Wikilinks]] for every concept and source.
   - Ground everything specifically in the topics of these documents (e.g. octopus husbandry, aquatic environments).
2. Propose meaningful cross-link relationships between these concepts with descriptive relationship types.`;

    const response = await callGeminiWithResilience({
      contents: prompt,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          homeMarkdown: {
            type: Type.STRING,
            description: "Complete 00 - Home.md markdown content for Obsidian",
          },
          relationships: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                sourceConcept: { type: Type.STRING },
                targetConcept: { type: Type.STRING },
                relationshipType: { type: Type.STRING },
              },
              required: ["sourceConcept", "targetConcept", "relationshipType"],
            },
          },
        },
        required: ["homeMarkdown", "relationships"],
      },
    });

    const parsed = cleanAndParseJson(response.text || "{}");
    console.log(`[POST /api/cross-reference] Successfully generated home note and ${parsed.relationships?.length || 0} cross-links`);
    res.json(parsed);
  } catch (error: any) {
    console.error("[POST /api/cross-reference] Error:", error);
    res.status(500).json({
      error: error?.message || "Failed to cross-reference concepts",
    });
  }
});

// 3. Endpoint: Synthesize or load preset sample demo for demonstration
app.post("/api/sample-demo", async (req: Request, res: Response) => {
  try {
    const { topic } = req.body;
    const isOctopus = topic === "octopus_husbandry";
    const selectedTopic = isOctopus
      ? "An Aquarist's Guide to Octopus Husbandry"
      : topic === "quantum_ai"
      ? "Quantum Computing & Information Theory"
      : "Neural Mechanisms of Memory";

    const prompt = `Generate a rich, authentic multi-concept knowledge base extraction for a document titled "${selectedTopic}".
Include:
- 1 Document metadata (Title, Language, DocumentType, OCR: false, Summary, 5 Main Topics)
- 7 deeply articulated Obsidian concept notes grounded strictly in "${selectedTopic}".
- Complete Obsidian Markdown content with YAML frontmatter, callouts, and [[Wikilinks]].`;

    const response = await callGeminiWithResilience({
      contents: prompt,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          fileName: { type: Type.STRING },
          docTitle: { type: Type.STRING },
          language: { type: Type.STRING },
          documentType: { type: Type.STRING },
          ocrDetected: { type: Type.BOOLEAN },
          summary: { type: Type.STRING },
          mainTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
          concepts: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                aliases: { type: Type.ARRAY, items: { type: Type.STRING } },
                category: { type: Type.STRING },
                summary: { type: Type.STRING },
                markdownContent: { type: Type.STRING },
                suggestedTags: { type: Type.ARRAY, items: { type: Type.STRING } },
                relatedConceptNames: { type: Type.ARRAY, items: { type: Type.STRING } },
                sourcePages: { type: Type.STRING },
              },
              required: ["name", "summary", "markdownContent", "category"],
            },
          },
        },
        required: ["docTitle", "language", "documentType", "ocrDetected", "summary", "mainTopics", "concepts"],
      },
    });

    const parsedData = cleanAndParseJson(response.text || "{}");
    const docTitle = parsedData.docTitle || selectedTopic;

    const result: DocumentAnalysisResult = {
      fileName: parsedData.fileName || `${selectedTopic.replace(/\s+/g, "_")}.pdf`,
      docTitle: docTitle,
      language: parsedData.language || "English",
      documentType: parsedData.documentType || "Comprehensive Guide",
      ocrDetected: Boolean(parsedData.ocrDetected),
      summary: parsedData.summary || "",
      mainTopics: parsedData.mainTopics || [],
      concepts: (parsedData.concepts || []).map((c: any, idx: number) => ({
        id: `demo-c${idx + 1}-${Date.now()}`,
        name: (c.name || "Concept").replace(/[/\\?%*:|"<>#]/g, "-").trim(),
        aliases: c.aliases || [],
        category: c.category || "Husbandry",
        summary: c.summary || "",
        markdownContent: c.markdownContent,
        suggestedTags: c.suggestedTags || [],
        relatedConceptNames: c.relatedConceptNames || [],
        sourceDocument: docTitle,
        sourcePages: c.sourcePages || "Section 1",
        language: parsedData.language || "English",
      })),
    };

    res.json(result);
  } catch (error: any) {
    console.error("Error generating sample demo:", error);
    res.status(500).json({ error: error?.message || "Failed to generate sample" });
  }
});

// 4. Endpoint: Download the complete application source code as a ZIP
app.get("/api/download-app-zip", async (_req: Request, res: Response) => {
  try {
    const JSZipModule = (await import("jszip")).default;
    const fs = await import("fs");
    const zip = new JSZipModule();
    const projectRoot = __dirname;

    // Add root configuration and documentation files
    const rootFiles = [
      "package.json",
      "tsconfig.json",
      "vite.config.ts",
      "index.html",
      "server.ts",
      "README.md",
      ".env.example",
      "metadata.json",
    ];

    for (const f of rootFiles) {
      const fullPath = path.join(projectRoot, f);
      if (fs.existsSync(fullPath)) {
        zip.file(f, fs.readFileSync(fullPath));
      }
    }

    // Helper to recursively add a directory
    function addDirToZip(dirPath: string, prefix: string) {
      if (!fs.existsSync(dirPath)) return;
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dirPath, entry.name);
        const rel = path.join(prefix, entry.name);
        if (entry.isDirectory()) {
          addDirToZip(full, rel);
        } else if (entry.isFile()) {
          zip.file(rel, fs.readFileSync(full));
        }
      }
    }

    // Add src directory
    addDirToZip(path.join(projectRoot, "src"), "src");

    const zipBuffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", 'attachment; filename="wikigen-app-source.zip"');
    res.send(zipBuffer);
  } catch (err: any) {
    console.error("Error creating app zip:", err);
    res.status(500).json({ error: "Failed to package app source code: " + err.message });
  }
});

// In development, mount Vite middleware; in production, serve built static files
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, () => {
    console.log(`WikiGen server running on http://localhost:${PORT}`);
  });
}

startServer();
