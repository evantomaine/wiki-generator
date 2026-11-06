import React, { useEffect, useRef, useState, useMemo } from "react";
import { DocumentAnalysisResult, ExtractedConcept } from "../types";
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Filter } from "lucide-react";
import { sanitizeVaultName } from "../utils/zipGenerator";

interface Node {
  id: string;
  name: string;
  type: "concept" | "source" | "home" | "tag";
  category?: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

interface Link {
  source: string;
  target: string;
  label?: string;
}

interface GraphViewProps {
  documents: DocumentAnalysisResult[];
  concepts: ExtractedConcept[];
  activeNotePath: string;
  onSelectNote: (path: string) => void;
  relationships?: Array<{ sourceConcept: string; targetConcept: string; relationshipType: string }>;
}

export const GraphView: React.FC<GraphViewProps> = ({
  documents,
  concepts,
  activeNotePath,
  onSelectNote,
  relationships = [],
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [filterType, setFilterType] = useState<"all" | "concepts" | "sources">("all");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedNode, setDraggedNode] = useState<Node | null>(null);

  // Generate nodes and links
  const { initialNodes, initialLinks } = useMemo(() => {
    const nodes: Node[] = [];
    const links: Link[] = [];

    // Home Node
    nodes.push({
      id: "wiki/00 - Home.md",
      name: "00 - Home",
      type: "home",
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius: 14,
      color: "#06b6d4", // Cyan
    });

    // Source Documents
    documents.forEach((doc, idx) => {
      const angle = (idx / Math.max(1, documents.length)) * 2 * Math.PI;
      const dist = 180;
      const canonicalDoc = sanitizeVaultName(doc.docTitle || doc.fileName);
      const path = `wiki/Sources/${canonicalDoc}.md`;
      nodes.push({
        id: path,
        name: canonicalDoc,
        type: "source",
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        vx: 0,
        vy: 0,
        radius: 12,
        color: "#10b981", // Emerald
      });

      // Link source to Home
      links.push({
        source: "wiki/00 - Home.md",
        target: path,
      });
    });

    // Concepts
    const conceptMap = new Map<string, string>();
    concepts.forEach((concept, idx) => {
      const canonicalConcept = sanitizeVaultName(concept.name);
      const path = `wiki/Concepts/${canonicalConcept}.md`;
      conceptMap.set(concept.name.toLowerCase(), path);
      conceptMap.set(canonicalConcept.toLowerCase(), path);
      const angle = (idx / Math.max(1, concepts.length)) * 2 * Math.PI + Math.PI / 4;
      const dist = 260 + (idx % 3) * 60;

      // Color scheme based on category
      const colors = ["#8b5cf6", "#ec4899", "#3b82f6", "#f59e0b", "#6366f1", "#14b8a6"];
      const hash = concept.category ? concept.category.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) : idx;
      const color = colors[hash % colors.length];

      nodes.push({
        id: path,
        name: canonicalConcept,
        type: "concept",
        category: concept.category,
        x: Math.cos(angle) * dist + (Math.random() - 0.5) * 50,
        y: Math.sin(angle) * dist + (Math.random() - 0.5) * 50,
        vx: 0,
        vy: 0,
        radius: 8 + Math.min(6, (concept.relatedConceptNames?.length || 0) * 1.5),
        color: color,
      });

      // Link concept to its Source document
      const rawDoc = concept.sourceDocument || documents[0]?.docTitle || documents[0]?.fileName || "Source Document";
      const docPath = `wiki/Sources/${sanitizeVaultName(rawDoc)}.md`;
      links.push({
        source: docPath,
        target: path,
      });

      // Link concept to related concepts
      for (const rel of concept.relatedConceptNames || []) {
        const canonicalRel = sanitizeVaultName(rel);
        const targetPath =
          conceptMap.get(rel.toLowerCase()) ||
          conceptMap.get(canonicalRel.toLowerCase());
        if (targetPath) {
          links.push({
            source: path,
            target: targetPath,
          });
        }
      }
    });

    // Relationships from cross-referencing
    for (const rel of relationships) {
      const sPath =
        conceptMap.get(rel.sourceConcept.toLowerCase()) ||
        conceptMap.get(sanitizeVaultName(rel.sourceConcept).toLowerCase());
      const tPath =
        conceptMap.get(rel.targetConcept.toLowerCase()) ||
        conceptMap.get(sanitizeVaultName(rel.targetConcept).toLowerCase());
      if (sPath && tPath && sPath !== tPath) {
        links.push({
          source: sPath,
          target: tPath,
          label: rel.relationshipType,
        });
      }
    }

    return { initialNodes: nodes, initialLinks: links };
  }, [documents, concepts, relationships]);

  // Keep animated node positions
  const simulationNodesRef = useRef<Node[]>([]);
  useEffect(() => {
    simulationNodesRef.current = initialNodes.map((n) => ({ ...n }));
  }, [initialNodes]);

  // Physics animation loop
  useEffect(() => {
    let animId: number;
    let iterations = 0;

    const runPhysics = () => {
      const nodes = simulationNodesRef.current;
      const nodeMap = new Map(nodes.map((n) => [n.id, n]));

      // 1. Repulsion between nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const distSq = dx * dx + dy * dy + 1;
          const dist = Math.sqrt(distSq);

          if (dist < 400) {
            const force = 1200 / (distSq + 200);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            a.vx -= fx;
            a.vy -= fy;
            b.vx += fx;
            b.vy += fy;
          }
        }
      }

      // 2. Spring attraction along links
      for (const link of initialLinks) {
        const source = nodeMap.get(link.source);
        const target = nodeMap.get(link.target);
        if (source && target) {
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const desiredDist = 120;
          const force = (dist - desiredDist) * 0.03;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          source.vx += fx;
          source.vy += fy;
          target.vx -= fx;
          target.vy -= fy;
        }
      }

      // 3. Gravity towards center & friction
      for (const node of nodes) {
        if (node === draggedNode) continue;
        node.vx += -node.x * 0.005;
        node.vy += -node.y * 0.005;

        node.vx *= 0.88; // Damping
        node.vy *= 0.88;

        node.x += node.vx;
        node.y += node.vy;
      }

      draw();
      iterations++;
      animId = requestAnimationFrame(runPhysics);
    };

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);
      ctx.save();

      // Apply pan & zoom centered
      ctx.translate(width / 2 + pan.x, height / 2 + pan.y);
      ctx.scale(zoom, zoom);

      const nodes = simulationNodesRef.current;
      const nodeMap = new Map(nodes.map((n) => [n.id, n]));

      // Determine connected nodes if a node is hovered or active
      const highlightedIds = new Set<string>();
      const activeOrHovered = hoveredNode?.id || activeNotePath;

      if (activeOrHovered) {
        highlightedIds.add(activeOrHovered);
        for (const link of initialLinks) {
          if (link.source === activeOrHovered) highlightedIds.add(link.target);
          if (link.target === activeOrHovered) highlightedIds.add(link.source);
        }
      }

      // Draw Links
      for (const link of initialLinks) {
        const source = nodeMap.get(link.source);
        const target = nodeMap.get(link.target);
        if (!source || !target) continue;

        if (filterType === "concepts" && (source.type !== "concept" || target.type !== "concept")) {
          continue;
        }
        if (filterType === "sources" && source.type !== "source" && target.type !== "source") {
          continue;
        }

        const isHighlighted =
          highlightedIds.has(source.id) && highlightedIds.has(target.id);

        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);

        if (isHighlighted) {
          ctx.strokeStyle = "rgba(168, 85, 247, 0.85)";
          ctx.lineWidth = 2;
        } else if (activeOrHovered && highlightedIds.size > 0) {
          ctx.strokeStyle = "rgba(100, 116, 139, 0.15)";
          ctx.lineWidth = 0.8;
        } else {
          ctx.strokeStyle = "rgba(148, 163, 184, 0.35)";
          ctx.lineWidth = 1;
        }
        ctx.stroke();
      }

      // Draw Nodes
      for (const node of nodes) {
        if (filterType === "concepts" && node.type !== "concept" && node.type !== "home") {
          continue;
        }
        if (filterType === "sources" && node.type !== "source" && node.type !== "home") {
          continue;
        }

        const isSelected = node.id === activeNotePath;
        const isHovered = hoveredNode?.id === node.id;
        const isNeighbor = highlightedIds.has(node.id);

        // Halo / Glow
        if (isSelected || isHovered) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 6, 0, Math.PI * 2);
          ctx.fillStyle = isSelected
            ? "rgba(147, 51, 234, 0.35)"
            : "rgba(59, 130, 246, 0.3)";
          ctx.fill();
        }

        // Node Circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);

        let opacity = 1;
        if (activeOrHovered && !isNeighbor && !isSelected && !isHovered) {
          opacity = 0.25;
        }

        ctx.fillStyle = node.color;
        ctx.globalAlpha = opacity;
        ctx.fill();

        ctx.strokeStyle = isSelected ? "#ffffff" : "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = isSelected ? 2.5 : 1;
        ctx.stroke();

        // Node Label
        const showLabel =
          isHovered ||
          isSelected ||
          isNeighbor ||
          zoom >= 0.95 ||
          node.type === "home" ||
          node.type === "source";

        if (showLabel) {
          ctx.font = `${node.type === "home" ? "bold 13px" : node.type === "source" ? "600 12px" : "11px"} Inter, sans-serif`;
          ctx.fillStyle = isSelected ? "#f8fafc" : isHovered ? "#38bdf8" : "rgba(226, 232, 240, 0.9)";
          ctx.textAlign = "center";
          ctx.textBaseline = "top";

          const label = node.name.length > 20 ? node.name.slice(0, 18) + "…" : node.name;
          ctx.fillText(label, node.x, node.y + node.radius + 4);
        }

        ctx.globalAlpha = 1;
      }

      ctx.restore();
    };

    animId = requestAnimationFrame(runPhysics);
    return () => cancelAnimationFrame(animId);
  }, [initialNodes, initialLinks, zoom, pan, hoveredNode, activeNotePath, filterType, draggedNode]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = containerRef.current.clientHeight;
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Helper to convert screen to world coords
  const screenToWorld = (screenX: number, screenY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = (screenX - rect.left - canvas.width / 2 - pan.x) / zoom;
    const y = (screenY - rect.top - canvas.height / 2 - pan.y) / zoom;
    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const { x, y } = screenToWorld(e.clientX, e.clientY);
    const nodes = simulationNodesRef.current;
    const hitNode = nodes.find((n) => {
      const dx = n.x - x;
      const dy = n.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= n.radius + 5;
    });

    if (hitNode) {
      setDraggedNode(hitNode);
    } else {
      setIsDraggingCanvas(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedNode) {
      const { x, y } = screenToWorld(e.clientX, e.clientY);
      draggedNode.x = x;
      draggedNode.y = y;
      draggedNode.vx = 0;
      draggedNode.vy = 0;
      return;
    }

    if (isDraggingCanvas) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
      return;
    }

    // Hit test for hover
    const { x, y } = screenToWorld(e.clientX, e.clientY);
    const nodes = simulationNodesRef.current;
    const hit = nodes.find((n) => {
      const dx = n.x - x;
      const dy = n.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= n.radius + 6;
    });
    setHoveredNode(hit || null);
  };

  const handleMouseUp = () => {
    setIsDraggingCanvas(false);
    setDraggedNode(null);
  };

  const handleClick = (e: React.MouseEvent) => {
    const { x, y } = screenToWorld(e.clientX, e.clientY);
    const nodes = simulationNodesRef.current;
    const hit = nodes.find((n) => {
      const dx = n.x - x;
      const dy = n.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= n.radius + 6;
    });

    if (hit) {
      onSelectNote(hit.id);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.87;
    setZoom((prev) => Math.min(3, Math.max(0.3, prev * factor)));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-slate-950 overflow-hidden select-none cursor-grab active:cursor-grabbing border border-slate-800 rounded-xl shadow-inner"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleClick}
      onWheel={handleWheel}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Floating Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 shadow-lg text-slate-300 text-xs">
        <button
          onClick={() => setZoom((z) => Math.min(3, z * 1.2))}
          className="p-1 hover:text-white hover:bg-slate-800 rounded transition"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.3, z * 0.8))}
          className="p-1 hover:text-white hover:bg-slate-800 rounded transition"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={resetView}
          className="p-1 hover:text-white hover:bg-slate-800 rounded transition"
          title="Reset View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <div className="h-4 w-[1px] bg-slate-700 mx-1" />

        <div className="flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="bg-transparent text-xs text-slate-200 outline-none cursor-pointer"
          >
            <option value="all" className="bg-slate-900">All Nodes</option>
            <option value="concepts" className="bg-slate-900">Concepts Only</option>
            <option value="sources" className="bg-slate-900">Sources Only</option>
          </select>
        </div>
      </div>

      {/* Legend & Stats */}
      <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-800/80 shadow text-[11px] text-slate-400 flex flex-col gap-1.5 pointer-events-none">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" /> Home Hub
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Source PDFs ({documents.length})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" /> Concepts ({concepts.length})
          </span>
        </div>
        <div className="text-slate-500 text-[10px]">
          Click any node to navigate • Drag nodes to reposition • Scroll to zoom
        </div>
      </div>

      {/* Hover Card Tooltip */}
      {hoveredNode && (
        <div
          className="absolute pointer-events-none z-20 bg-slate-900/95 border border-purple-500/40 rounded-lg p-2.5 shadow-xl text-xs max-w-xs backdrop-blur-md"
          style={{
            left: Math.min(
              window.innerWidth - 250,
              canvasRef.current ? canvasRef.current.width / 2 + pan.x + hoveredNode.x * zoom + 15 : 20
            ),
            top: Math.max(
              20,
              canvasRef.current ? canvasRef.current.height / 2 + pan.y + hoveredNode.y * zoom - 30 : 20
            ),
          }}
        >
          <div className="flex items-center gap-1.5 mb-1 font-semibold text-slate-100">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: hoveredNode.color }}
            />
            {hoveredNode.name}
          </div>
          {hoveredNode.category && (
            <div className="text-[10px] text-purple-400 uppercase tracking-wider mb-1">
              {hoveredNode.category}
            </div>
          )}
          <div className="text-[11px] text-slate-400">
            {hoveredNode.type === "concept" && "Obsidian Concept Note"}
            {hoveredNode.type === "source" && "PDF Source Document"}
            {hoveredNode.type === "home" && "Vault Dashboard"}
          </div>
        </div>
      )}
    </div>
  );
};
