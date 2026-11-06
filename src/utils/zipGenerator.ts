import JSZip from "jszip";
import { DocumentAnalysisResult, ExtractedConcept } from "../types";

export interface VaultFile {
  path: string; // e.g. "wiki/00 - Home.md"
  content: string;
}

export interface LinkValidationResult {
  totalLinks: number;
  validLinks: number;
  brokenLinks: Array<{ sourceFile: string; linkTarget: string }>;
  isValid: boolean;
}

/**
 * Canonical sanitizer for note names and filenames.
 * Replaces illegal filesystem and Obsidian characters with dashes, collapses whitespace.
 */
export function sanitizeVaultName(name: string): string {
  if (!name) return "Untitled";
  return name
    .replace(/[/\\?%*:|"<>#^]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Validates all wikilinks across an array of vault files against the exported filenames.
 */
export function validateVaultLinks(files: VaultFile[]): LinkValidationResult {
  // Build a lookup set of valid note names (without "wiki/" or ".md")
  const validNoteNames = new Set<string>();
  const validNoteNamesLower = new Map<string, string>();

  for (const f of files) {
    if (f.path.endsWith(".md")) {
      const base = f.path.split("/").pop()!.replace(/\.md$/, "");
      validNoteNames.add(base);
      validNoteNamesLower.set(base.toLowerCase(), base);
    }
  }

  const brokenLinks: Array<{ sourceFile: string; linkTarget: string }> = [];
  let totalLinks = 0;
  let validLinks = 0;

  for (const f of files) {
    if (!f.path.endsWith(".md")) continue;

    // Remove inline code and code blocks so syntax demos like `[[example]]` are not treated as links
    const cleanContent = f.content
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`\[\[.*?\]\]`/g, "");

    const linkRegex = /\[\[(.*?)\]\]/g;
    let match: RegExpExecArray | null;

    while ((match = linkRegex.exec(cleanContent)) !== null) {
      totalLinks++;
      const rawTarget = match[1].split("|")[0].trim();
      const target = sanitizeVaultName(rawTarget);

      if (validNoteNames.has(target) || validNoteNamesLower.has(target.toLowerCase())) {
        validLinks++;
      } else {
        brokenLinks.push({
          sourceFile: f.path,
          linkTarget: rawTarget,
        });
      }
    }
  }

  return {
    totalLinks,
    validLinks,
    brokenLinks,
    isValid: brokenLinks.length === 0,
  };
}

/**
 * Builds all Obsidian-compatible Markdown files and configuration files,
 * normalizes YAML frontmatter, validates and aligns all internal wikilinks,
 * and packages them into a clean .zip file with root folder "wiki/".
 */
export async function generateWikiZip(
  documents: DocumentAnalysisResult[],
  concepts: ExtractedConcept[],
  homeMarkdown?: string,
  extraRelationships?: Array<{ sourceConcept: string; targetConcept: string; relationshipType: string }>
): Promise<{ blob: Blob; files: VaultFile[]; validation: LinkValidationResult }> {
  const zip = new JSZip();
  let rawFiles: VaultFile[] = [];

  // Build canonical map of concept names
  const conceptNameMap = new Map<string, string>();
  for (const c of concepts) {
    const cleanName = sanitizeVaultName(c.name);
    conceptNameMap.set(c.name.toLowerCase(), cleanName);
    conceptNameMap.set(cleanName.toLowerCase(), cleanName);
  }

  // Build canonical map of document names
  const docNameMap = new Map<string, string>();
  for (const d of documents) {
    const raw = d.docTitle || d.fileName;
    const clean = sanitizeVaultName(raw);
    docNameMap.set(raw.toLowerCase(), clean);
    docNameMap.set(d.fileName.toLowerCase(), clean);
    docNameMap.set(clean.toLowerCase(), clean);
  }

  // 1. Generate 00 - Home.md
  let homeContent = homeMarkdown;
  if (!homeContent) {
    homeContent = buildDefaultHomeNote(documents, concepts);
  }
  rawFiles.push({ path: "wiki/00 - Home.md", content: homeContent });

  // 2. Generate individual Concept files in wiki/Concepts/
  for (const concept of concepts) {
    const canonicalName = sanitizeVaultName(concept.name);
    const content = formatConceptMarkdown(
      concept,
      concepts,
      documents,
      extraRelationships,
      docNameMap,
      conceptNameMap
    );
    rawFiles.push({
      path: `wiki/Concepts/${canonicalName}.md`,
      content,
    });
  }

  // 3. Generate Source Document notes in wiki/Sources/
  for (const doc of documents) {
    const canonicalName = sanitizeVaultName(doc.docTitle || doc.fileName);
    const content = formatSourceDocumentMarkdown(doc, concepts, conceptNameMap);
    rawFiles.push({
      path: `wiki/Sources/${canonicalName}.md`,
      content,
    });
  }

  // 4. Generate Tag MOCs in wiki/Tags/
  const tagMap = new Map<string, string[]>();
  for (const c of concepts) {
    for (const tag of c.suggestedTags || []) {
      const cleanTag = tag.replace(/^#/, "");
      if (!tagMap.has(cleanTag)) {
        tagMap.set(cleanTag, []);
      }
      tagMap.get(cleanTag)!.push(sanitizeVaultName(c.name));
    }
  }

  for (const [tag, linkedConcepts] of tagMap.entries()) {
    const tagFilename = sanitizeVaultName(tag.replace(/\//g, " - "));
    const tagContent = [
      "---",
      `tag: "#${tag}"`,
      `type: "tag-index"`,
      "---",
      `# Tag: #${tag}`,
      "",
      `This Map of Content groups all concepts associated with \`#${tag}\`.`,
      "",
      "## Associated Concepts",
      ...linkedConcepts.map((name) => `- [[${name}]]`),
      "",
      "---",
      "*Generated by WikiGen for Obsidian*",
    ].join("\n");

    rawFiles.push({
      path: `wiki/Tags/${tagFilename}.md`,
      content: tagContent,
    });
  }

  // 5. Normalization pass: Ensure every wikilink in every file matches canonical targets exactly
  const canonicalTargets = new Map<string, string>();
  for (const f of rawFiles) {
    if (f.path.endsWith(".md")) {
      const base = f.path.split("/").pop()!.replace(/\.md$/, "");
      canonicalTargets.set(base.toLowerCase(), base);
    }
  }

  const normalizedFiles: VaultFile[] = rawFiles.map((f) => {
    if (!f.path.endsWith(".md")) return f;
    const alignedContent = alignAllWikilinks(f.content, canonicalTargets);
    return {
      path: f.path,
      content: alignedContent,
    };
  });

  // 6. Validate all links
  const validation = validateVaultLinks(normalizedFiles);

  // 7. Generate .obsidian vault preferences
  const obsidianAppJson = JSON.stringify(
    {
      legacyEditor: false,
      livePreview: true,
      showLineNumber: true,
      useTab: true,
      tabSize: 2,
      autoPairMarkdown: true,
      autoPairBrackets: true,
      newFileFolderPath: "Concepts",
      promptDelete: false,
    },
    null,
    2
  );

  const obsidianGraphJson = JSON.stringify(
    {
      "collapse-filter": false,
      search: "",
      localJumps: 1,
      localBacklinks: true,
      localForelinks: true,
      localInterlinks: true,
      showTags: true,
      showAttachments: false,
      hideUnresolved: false,
      showOrphans: true,
      colorGroups: [
        {
          query: "path:Concepts",
          color: { a: 1, rgb: 9896178 }, // Purple
        },
        {
          query: "path:Sources",
          color: { a: 1, rgb: 4429789 }, // Emerald
        },
        {
          query: "path:Tags",
          color: { a: 1, rgb: 16753920 }, // Amber
        },
      ],
      nodeSizeMultiplier: 1.25,
      lineSizeMultiplier: 1,
      textFadeMultiplier: 0,
      linkStrength: 1,
      linkDistance: 160,
      scale: 1,
    },
    null,
    2
  );

  normalizedFiles.push({ path: "wiki/.obsidian/app.json", content: obsidianAppJson });
  normalizedFiles.push({ path: "wiki/.obsidian/graph.json", content: obsidianGraphJson });

  // Add all files to the ZIP
  for (const file of normalizedFiles) {
    zip.file(file.path, file.content);
  }

  const blob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  return { blob, files: normalizedFiles, validation };
}

/**
 * Replaces any slightly mismatched wikilink targets (e.g. colons instead of dashes)
 * with the exact canonical filename on disk.
 */
function alignAllWikilinks(content: string, canonicalTargets: Map<string, string>): string {
  return content.replace(/\[\[(.*?)\]\]/g, (fullMatch, inner) => {
    const [rawTarget, display] = inner.split("|");
    const cleanTarget = sanitizeVaultName(rawTarget.trim());
    const lookupKey = cleanTarget.toLowerCase();

    const matchedCanonical = canonicalTargets.get(lookupKey);

    if (matchedCanonical) {
      if (display) {
        return `[[${matchedCanonical}|${display.trim()}]]`;
      }
      return `[[${matchedCanonical}]]`;
    }

    // Default to sanitized target
    if (display) {
      return `[[${cleanTarget}|${display.trim()}]]`;
    }
    return `[[${cleanTarget}]]`;
  });
}

function buildDefaultHomeNote(
  documents: DocumentAnalysisResult[],
  concepts: ExtractedConcept[]
): string {
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
    `> This wiki was generated from **${documents.length} source document(s)** containing **${concepts.length} interconnected concepts**.`,
    "> All pages feature bidirectional wikilinks strictly matching exported file names for Obsidian.",
    "",
    "## 📚 Source Documents",
    "",
    ...documents.map((d) => {
      const canonicalDoc = sanitizeVaultName(d.docTitle || d.fileName);
      return `- **[[${canonicalDoc}]]** (${d.documentType || "Document"}) - *${d.language || "English"}* ${
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
    "## 🕸️ Quick Graph Tip",
    "",
    "Press `Ctrl + G` (or `Cmd + G` on Mac) in Obsidian to open the **Graph View** and visualize how all these concepts and source documents cross-link in real time!",
    "",
    "---",
    "*Generated with WikiGen for Obsidian*"
  );

  return lines.join("\n");
}

function formatConceptMarkdown(
  concept: ExtractedConcept,
  allConcepts: ExtractedConcept[],
  documents: DocumentAnalysisResult[],
  extraRelationships: Array<{ sourceConcept: string; targetConcept: string; relationshipType: string }> | undefined,
  docNameMap: Map<string, string>,
  conceptNameMap: Map<string, string>
): string {
  const canonicalConceptName = sanitizeVaultName(concept.name);
  const rawDoc = concept.sourceDocument || documents[0]?.docTitle || documents[0]?.fileName || "Source Document";
  const canonicalSourceDoc = docNameMap.get(rawDoc.toLowerCase()) || sanitizeVaultName(rawDoc);

  let rawContent = concept.markdownContent || "";

  // Strip existing frontmatter to rebuild pristine, valid YAML
  let bodyContent = rawContent;
  if (rawContent.startsWith("---")) {
    const parts = rawContent.split(/^---$/m);
    if (parts.length >= 3) {
      bodyContent = parts.slice(2).join("---").trim();
    }
  }

  // Compile valid related concept names
  const backlinkNames = allConcepts
    .filter(
      (other) =>
        other.name.toLowerCase() !== concept.name.toLowerCase() &&
        (other.markdownContent.toLowerCase().includes(concept.name.toLowerCase()) ||
          (other.relatedConceptNames || []).some((r) => r.toLowerCase() === concept.name.toLowerCase()))
    )
    .map((other) => sanitizeVaultName(other.name));

  const relItems = (extraRelationships || [])
    .filter(
      (rel) =>
        rel.sourceConcept.toLowerCase() === concept.name.toLowerCase() ||
        rel.targetConcept.toLowerCase() === concept.name.toLowerCase()
    )
    .map((rel) => {
      const other =
        rel.sourceConcept.toLowerCase() === concept.name.toLowerCase()
          ? rel.targetConcept
          : rel.sourceConcept;
      return sanitizeVaultName(other);
    });

  const allRelatedCanonical = Array.from(
    new Set([
      ...(concept.relatedConceptNames || []).map((r) => conceptNameMap.get(r.toLowerCase()) || sanitizeVaultName(r)),
      ...relItems,
      ...backlinkNames,
    ])
  ).filter((name) => name.toLowerCase() !== canonicalConceptName.toLowerCase());

  // Build clean, valid YAML frontmatter with quoted wikilinks
  const frontmatterLines = [
    "---",
    `title: "${canonicalConceptName.replace(/"/g, '\\"')}"`,
    `category: "${(concept.category || "General").replace(/"/g, '\\"')}"`,
    concept.aliases && concept.aliases.length > 0
      ? `aliases:\n${concept.aliases.map((a) => `  - "${a.replace(/"/g, '\\"')}"`).join("\n")}`
      : "aliases: []",
    concept.suggestedTags && concept.suggestedTags.length > 0
      ? `tags:\n${concept.suggestedTags.map((t) => `  - "${t.replace(/^#/, "").replace(/"/g, '\\"')}"`).join("\n")}`
      : "tags: []",
    `source_document: "[[${canonicalSourceDoc}]]"`,
    "sources:",
    `  - "[[${canonicalSourceDoc}]]"`,
    allRelatedCanonical.length > 0
      ? `related:\n${allRelatedCanonical.map((r) => `  - "[[${r}]]"`).join("\n")}`
      : "related: []",
    `language: "${concept.language || "English"}"`,
    "---",
    "",
  ];

  let formatted = frontmatterLines.join("\n");

  if (!bodyContent.startsWith("# ")) {
    formatted += `# ${canonicalConceptName}\n\n`;
    if (concept.summary) {
      formatted += `> [!INFO] Definition\n> ${concept.summary}\n\n`;
    }
  }

  formatted += bodyContent;

  // Add Cross-References section if not already present
  if (!formatted.includes("## Cross-References") && !formatted.includes("## Related Concepts")) {
    const crossRefLines = [
      "",
      "---",
      "## 🔗 Cross-References & Mentions",
      "",
      `**Source Document:** [[${canonicalSourceDoc}]] (${concept.sourcePages || "Reference Section"})`,
      "",
    ];

    if (allRelatedCanonical.length > 0) {
      crossRefLines.push("### Connected Concepts");
      for (const r of allRelatedCanonical) {
        crossRefLines.push(`- [[${r}]]`);
      }
    }

    formatted += "\n" + crossRefLines.join("\n");
  }

  return formatted;
}

function formatSourceDocumentMarkdown(
  doc: DocumentAnalysisResult,
  concepts: ExtractedConcept[],
  conceptNameMap: Map<string, string>
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
    ...docConcepts.map((c) => {
      const canonicalConcept = conceptNameMap.get(c.name.toLowerCase()) || sanitizeVaultName(c.name);
      return `- **[[${canonicalConcept}]]** (${c.category || "General"}): ${c.summary}`;
    }),
    "",
    "---",
    "[[00 - Home|⬅️ Back to Vault Home]]",
  ];

  return lines.join("\n");
}
