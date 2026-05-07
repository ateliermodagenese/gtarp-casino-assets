"use client";

/**
 * DomTreePanel.tsx
 *
 * Arvore DOM do iframe. Mostra hierarquia completa dos elementos
 * com expand/collapse, busca, e click pra selecionar.
 * Breadcrumbs no topo mostrando caminho ate o elemento selecionado.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { DomElementInfo } from "../IframeEditor";

interface DomTreePanelProps {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  iframeLoaded: boolean;
  selected: DomElementInfo | null;
  onSelect: (el: HTMLElement) => void;
}

interface TreeNode {
  element: HTMLElement;
  tag: string;
  id: string;
  classes: string;
  text: string;
  children: TreeNode[];
  depth: number;
}

/** Montar arvore a partir do body do iframe */
function buildTree(el: HTMLElement, depth: number, maxDepth: number): TreeNode | null {
  if (depth > maxDepth) return null;
  if (el.tagName === "SCRIPT" || el.tagName === "STYLE" || el.tagName === "LINK") return null;

  const tag = el.tagName.toLowerCase();
  const id = el.id || "";
  const classList = el.className && typeof el.className === "string"
    ? el.className.split(/\s+/).filter(Boolean).slice(0, 3).join(".")
    : "";
  const textContent = el.childNodes.length === 1 && el.childNodes[0].nodeType === 3
    ? (el.childNodes[0].textContent || "").trim().slice(0, 20)
    : "";

  const children: TreeNode[] = [];
  for (let i = 0; i < el.children.length; i++) {
    const child = el.children[i] as HTMLElement;
    const node = buildTree(child, depth + 1, maxDepth);
    if (node) children.push(node);
  }

  return { element: el, tag, id, classes: classList, text: textContent, children, depth };
}

/** Obter caminho breadcrumb ate o root */
function getBreadcrumb(el: HTMLElement): HTMLElement[] {
  const path: HTMLElement[] = [];
  let current: HTMLElement | null = el;
  while (current && current.tagName !== "BODY" && current.tagName !== "HTML") {
    path.unshift(current);
    current = current.parentElement;
  }
  return path;
}

export default function DomTreePanel({ iframeRef, iframeLoaded, selected, onSelect }: DomTreePanelProps) {
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [expanded, setExpanded] = useState<Set<HTMLElement>>(new Set());
  const [search, setSearch] = useState("");
  const [breadcrumb, setBreadcrumb] = useState<HTMLElement[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reconstruir arvore quando iframe carrega ou a cada 3s (pra pegar mudancas)
  const rebuildTree = useCallback(() => {
    if (!iframeRef.current || !iframeLoaded) {
      setTree(null);
      return;
    }
    try {
      const doc = iframeRef.current.contentWindow?.document;
      if (!doc?.body) return;
      const root = buildTree(doc.body, 0, 15);
      setTree(root);
    } catch {
      setTree(null);
    }
  }, [iframeRef, iframeLoaded]);

  useEffect(() => {
    rebuildTree();
    const interval = setInterval(rebuildTree, 3000);
    return () => clearInterval(interval);
  }, [rebuildTree]);

  // Atualizar breadcrumb quando selecionado muda
  useEffect(() => {
    if (selected) {
      setBreadcrumb(getBreadcrumb(selected.element));
      // Auto-expand pais do elemento selecionado
      const path = getBreadcrumb(selected.element);
      setExpanded((prev) => {
        const next = new Set(prev);
        path.forEach((el) => next.add(el));
        return next;
      });
    } else {
      setBreadcrumb([]);
    }
  }, [selected]);

  const toggleExpand = useCallback((el: HTMLElement) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(el)) next.delete(el);
      else next.add(el);
      return next;
    });
  }, []);

  const handleSelect = useCallback((el: HTMLElement) => {
    onSelect(el);
  }, [onSelect]);

  const matchesSearch = useCallback((node: TreeNode): boolean => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      node.tag.includes(q) ||
      node.id.toLowerCase().includes(q) ||
      node.classes.toLowerCase().includes(q) ||
      node.text.toLowerCase().includes(q)
    );
  }, [search]);

  /** Checar se algum descendente bate com a busca */
  const hasMatchingDescendant = useCallback((node: TreeNode): boolean => {
    if (matchesSearch(node)) return true;
    return node.children.some((c) => hasMatchingDescendant(c));
  }, [matchesSearch]);

  const renderNode = useCallback((node: TreeNode): React.ReactNode => {
    if (search && !hasMatchingDescendant(node)) return null;

    const isSelected = selected?.element === node.element;
    const isExpanded = expanded.has(node.element);
    const hasChildren = node.children.length > 0;
    const indent = node.depth * 14;
    const matches = matchesSearch(node);

    return (
      <div key={`${node.tag}-${node.depth}-${node.id || node.classes || Math.random()}`}>
        <div
          ref={(el) => {
            // Auto-scroll na árvore quando elemento é selecionado
            if (isSelected && el) {
              el.scrollIntoView({ block: "nearest", behavior: "smooth" });
            }
          }}
          onClick={(e) => {
            e.stopPropagation();
            handleSelect(node.element);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 3,
            paddingLeft: indent,
            paddingRight: 4,
            paddingTop: 2,
            paddingBottom: 2,
            cursor: "pointer",
            background: isSelected ? "rgba(212,168,67,0.15)" : "transparent",
            borderLeft: isSelected ? "2px solid #D4A843" : "2px solid transparent",
            opacity: matches || !search ? 1 : 0.3,
            fontSize: 10,
            fontFamily: "ui-monospace, monospace",
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
          title={`<${node.tag}>${node.id ? ` #${node.id}` : ""}${node.classes ? ` .${node.classes}` : ""}`}
        >
          {/* Expand/collapse arrow */}
          {hasChildren ? (
            <span
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(node.element);
              }}
              style={{
                display: "inline-flex",
                width: 12,
                justifyContent: "center",
                color: "#8a8a8a",
                fontSize: 8,
                flexShrink: 0,
                transform: isExpanded ? "rotate(90deg)" : "rotate(0)",
                transition: "transform 0.1s",
                cursor: "pointer",
              }}
            >
              &#9654;
            </span>
          ) : (
            <span style={{ width: 12, flexShrink: 0 }} />
          )}

          {/* Tag name */}
          <span style={{ color: isSelected ? "#D4A843" : "#8cb4d4", flexShrink: 0 }}>
            {node.tag}
          </span>

          {/* ID */}
          {node.id && (
            <span style={{ color: "#c792ea", flexShrink: 0 }}>
              #{node.id}
            </span>
          )}

          {/* Classes (max 2) */}
          {node.classes && (
            <span style={{ color: "#6a6a6a", overflow: "hidden", textOverflow: "ellipsis" }}>
              .{node.classes}
            </span>
          )}

          {/* Text content */}
          {node.text && (
            <span style={{ color: "#5a5a5a", overflow: "hidden", textOverflow: "ellipsis", marginLeft: 2 }}>
              &quot;{node.text}&quot;
            </span>
          )}
        </div>

        {/* Children */}
        {isExpanded && hasChildren && (
          <div>
            {node.children.map((child, idx) => renderNode(child))}
          </div>
        )}
      </div>
    );
  }, [selected, expanded, search, handleSelect, toggleExpand, matchesSearch, hasMatchingDescendant]);

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <span style={{ color: "#D4A843", fontWeight: 700, fontSize: 10, letterSpacing: 0.8 }}>
          ARVORE DOM
        </span>
        <span style={{ color: "#5a5a5a", fontSize: 10 }}>
          {tree ? countNodes(tree) : 0}
        </span>
      </div>

      {/* Breadcrumbs */}
      {breadcrumb.length > 0 && (
        <div style={breadcrumbBarStyle}>
          {breadcrumb.map((el, i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
              {i > 0 && <span style={{ color: "#4a4a4a", fontSize: 8 }}>&rsaquo;</span>}
              <button
                onClick={() => handleSelect(el)}
                style={{
                  background: el === selected?.element ? "rgba(212,168,67,0.2)" : "transparent",
                  border: "none",
                  color: el === selected?.element ? "#D4A843" : "#8a8a8a",
                  fontSize: 9,
                  cursor: "pointer",
                  padding: "1px 3px",
                  borderRadius: 2,
                  fontFamily: "ui-monospace, monospace",
                }}
              >
                {el.tagName.toLowerCase()}
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search */}
      <div style={searchBarStyle}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar tag, class, id..."
          style={searchInputStyle}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            style={{ background: "none", border: "none", color: "#8a8a8a", cursor: "pointer", fontSize: 10, padding: "0 4px" }}
          >
            &#x2715;
          </button>
        )}
      </div>

      {/* Tree */}
      <div ref={scrollRef} style={scrollStyle} className="editor-scroll">
        {tree ? renderNode(tree) : (
          <p style={{ color: "#5a5a5a", fontSize: 10, padding: 8, textAlign: "center" }}>
            {iframeLoaded ? "Nenhum elemento" : "Carregando..."}
          </p>
        )}
      </div>
    </div>
  );
}

function countNodes(node: TreeNode): number {
  return 1 + node.children.reduce((sum, c) => sum + countNodes(c), 0);
}

const containerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  flex: 1,
  minHeight: 100,
  maxHeight: "calc(100vh - 420px)",
  background: "#0d0a08",
  border: "1px solid rgba(212,168,67,0.15)",
  borderRadius: 8,
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "8px 10px",
  borderBottom: "1px solid rgba(212,168,67,0.12)",
};

const breadcrumbBarStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 1,
  padding: "4px 8px",
  background: "rgba(212,168,67,0.04)",
  borderBottom: "1px solid rgba(212,168,67,0.08)",
  overflowX: "auto",
  whiteSpace: "nowrap",
  minHeight: 22,
};

const searchBarStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  padding: "4px 8px",
  borderBottom: "1px solid rgba(212,168,67,0.08)",
};

const searchInputStyle: React.CSSProperties = {
  flex: 1,
  background: "transparent",
  border: "none",
  color: "#e5e5e5",
  fontSize: 10,
  fontFamily: "ui-monospace, monospace",
  outline: "none",
  padding: "2px 0",
};

const scrollStyle: React.CSSProperties = {
  flex: 1,
  overflow: "auto",
  padding: "4px 0",
};
