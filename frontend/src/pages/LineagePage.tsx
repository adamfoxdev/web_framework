import { useState, useRef, useCallback } from "react";
import { ZoomIn, ZoomOut, Maximize2, Eye, EyeOff, Play, CheckCircle, AlertTriangle, XCircle, ChevronRight, X, Settings, RefreshCw, ArrowRight, MoreHorizontal, Code2, Workflow } from "lucide-react";

const pipelineNodes = [
  { id: "src_salesforce", label: "Salesforce", group: "source", col: 0, row: 0, status: "healthy", type: "API", records: "1.2M/day", icon: "SF" },
  { id: "src_postgres", label: "PostgreSQL", group: "source", col: 0, row: 1, status: "healthy", type: "Database", records: "4.8M/day", icon: "PG" },
  { id: "src_stripe", label: "Stripe", group: "source", col: 0, row: 2, status: "warning", type: "API", records: "890K/day", icon: "ST" },
  { id: "src_hubspot", label: "HubSpot", group: "source", col: 0, row: 3, status: "healthy", type: "API", records: "120K/day", icon: "HS" },
  { id: "stg_contacts", label: "stg_contacts", group: "staging", col: 1, row: 0, status: "healthy", type: "View", records: "1.8M rows", icon: "TB" },
  { id: "stg_orders", label: "stg_orders", group: "staging", col: 1, row: 1, status: "healthy", type: "View", records: "12.4M rows", icon: "TB" },
  { id: "stg_payments", label: "stg_payments", group: "staging", col: 1, row: 2, status: "error", type: "View", records: "—", icon: "TB" },
  { id: "stg_campaigns", label: "stg_campaigns", group: "staging", col: 1, row: 3, status: "healthy", type: "View", records: "45K rows", icon: "TB" },
  { id: "int_customer_orders", label: "int_customer_orders", group: "intermediate", col: 2, row: 0.5, status: "healthy", type: "Table", records: "8.9M rows", icon: "TB" },
  { id: "int_revenue", label: "int_revenue", group: "intermediate", col: 2, row: 2, status: "warning", type: "Table", records: "2.1M rows", icon: "TB" },
  { id: "dim_customers", label: "dim_customers", group: "mart", col: 3, row: 0, status: "healthy", type: "Table", records: "340K rows", icon: "DM" },
  { id: "fact_orders", label: "fact_orders", group: "mart", col: 3, row: 1, status: "healthy", type: "Table", records: "12.4M rows", icon: "FT" },
  { id: "fact_revenue", label: "fact_revenue", group: "mart", col: 3, row: 2, status: "warning", type: "Table", records: "2.1M rows", icon: "FT" },
  { id: "dim_campaigns", label: "dim_campaigns", group: "mart", col: 3, row: 3, status: "healthy", type: "Table", records: "45K rows", icon: "DM" },
  { id: "exp_dashboard", label: "Revenue Dashboard", group: "exposure", col: 4, row: 0.5, status: "healthy", type: "Dashboard", records: "Updated 5m ago", icon: "BI" },
  { id: "exp_report", label: "Weekly Report", group: "exposure", col: 4, row: 2, status: "healthy", type: "Report", records: "Sent Mon 9am", icon: "RP" },
  { id: "exp_ml", label: "Churn Model", group: "exposure", col: 4, row: 3, status: "healthy", type: "ML Model", records: "v2.4 deployed", icon: "ML" },
];

const edges = [
  ["src_salesforce", "stg_contacts"], ["src_postgres", "stg_orders"], ["src_stripe", "stg_payments"],
  ["src_hubspot", "stg_campaigns"], ["stg_contacts", "int_customer_orders"], ["stg_orders", "int_customer_orders"],
  ["stg_orders", "int_revenue"], ["stg_payments", "int_revenue"], ["int_customer_orders", "dim_customers"],
  ["int_customer_orders", "fact_orders"], ["int_revenue", "fact_revenue"], ["stg_campaigns", "dim_campaigns"],
  ["dim_customers", "exp_dashboard"], ["fact_orders", "exp_dashboard"], ["fact_revenue", "exp_dashboard"],
  ["fact_revenue", "exp_report"], ["dim_customers", "exp_ml"], ["fact_orders", "exp_ml"],
];

const groupColors: Record<string, any> = {
  source: { bg: "#1e1b4b", border: "#4338ca", accent: "#818cf8", label: "Sources" },
  staging: { bg: "#172554", border: "#2563eb", accent: "#60a5fa", label: "Staging" },
  intermediate: { bg: "#1a2e05", border: "#4d7c0f", accent: "#84cc16", label: "Intermediate" },
  mart: { bg: "#431407", border: "#c2410c", accent: "#fb923c", label: "Marts" },
  exposure: { bg: "#3b0764", border: "#9333ea", accent: "#c084fc", label: "Exposures" },
};

const statusIcons: Record<string, React.ElementType> = { healthy: CheckCircle, warning: AlertTriangle, error: XCircle };
const statusColors: Record<string, string> = { healthy: "#22c55e", warning: "#eab308", error: "#ef4444" };

const NODE_W = 170, NODE_H = 64, COL_GAP = 240, ROW_GAP = 90, PAD_X = 80, PAD_Y = 60;
const getNodePos = (node: any) => ({ x: PAD_X + node.col * COL_GAP, y: PAD_Y + node.row * ROW_GAP });

export default function LineagePage() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [filterGroup, setFilterGroup] = useState("all");
  const [showLabels, setShowLabels] = useState(true);
  const canvasRef = useRef<HTMLDivElement>(null);

  const selected = pipelineNodes.find(n => n.id === selectedNode);
  const highlightedEdges = selectedNode ? edges.filter(([f, t]) => f === selectedNode || t === selectedNode) : [];
  const highlightedNodes = selectedNode ? new Set([selectedNode, ...highlightedEdges.flat()]) : new Set();

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target === canvasRef.current || target.closest("svg.bg-svg")) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      setSelectedNode(null);
    }
  }, [pan]);
  const handleMouseMove = useCallback((e: React.MouseEvent) => { if (isPanning) setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y }); }, [isPanning, panStart]);
  const handleMouseUp = useCallback(() => setIsPanning(false), []);

  const filteredNodes = filterGroup === "all" ? pipelineNodes : pipelineNodes.filter(n => n.group === filterGroup);
  const filteredIds = new Set(filteredNodes.map(n => n.id));

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden", fontFamily: "'Geist', -apple-system, sans-serif", background: "#09090b", color: "#e4e4e7", fontSize: 13 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        .cv-btn { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 8px; background: #18181b; border: 1px solid #27272a; cursor: pointer; transition: all 0.12s; color: #71717a; }
        .cv-btn:hover { background: #27272a; color: #e4e4e7; }
        .cv-btn.active { background: #3f3f46; color: white; }
        .gchip { padding: 5px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1px solid #27272a; background: #18181b; color: #71717a; transition: all 0.12s; font-family: inherit; }
        .gchip:hover { border-color: #3f3f46; color: #a1a1aa; }
        .gchip.active { border-color: #52525b; color: #e4e4e7; background: #27272a; }
        .inspector { width: 340px; min-width: 340px; background: #09090b; border-left: 1px solid #18181b; display: flex; flex-direction: column; overflow: auto; animation: slideR 0.2s ease; }
        @keyframes slideR { from { opacity:0; transform:translateX(12px) } to { opacity:1; transform:translateX(0) } }
      `}</style>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Toolbar */}
        <header style={{ height: 52, minHeight: 52, background: "#09090b", borderBottom: "1px solid #18181b", display: "flex", alignItems: "center", padding: "0 16px", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg, #7c3aed, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Workflow size={14} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 15.5, color: "#fafafa" }}>Lineage</span>
          <ChevronRight size={14} color="#3f3f46" />
          <span style={{ fontWeight: 600, fontSize: 13.5, color: "#a1a1aa" }}>E-Commerce Pipeline</span>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", gap: 4, marginRight: 8 }}>
            <button className={`gchip ${filterGroup === "all" ? "active" : ""}`} onClick={() => setFilterGroup("all")}>All</button>
            {Object.entries(groupColors).map(([k, v]) => (
              <button key={k} className={`gchip ${filterGroup === k ? "active" : ""}`} onClick={() => setFilterGroup(k)}
                style={filterGroup === k ? { borderColor: v.border, color: v.accent, background: v.bg } : {}}>
                <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: v.accent, marginRight: 5 }} />
                {v.label}
              </button>
            ))}
          </div>
          <div style={{ width: 1, height: 24, background: "#27272a" }} />
          <button className="cv-btn"><Play size={15} /></button>
          <button className="cv-btn"><RefreshCw size={15} /></button>
          <button className="cv-btn"><Settings size={15} /></button>
        </header>

        {/* Canvas */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden", cursor: isPanning ? "grabbing" : "grab" }}
          ref={canvasRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>

          <svg className="bg-svg" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "all" }}>
            <defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="#18181b" strokeWidth="0.5" /></pattern></defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          <div style={{ position: "absolute", inset: 0, transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "0 0", transition: isPanning ? "none" : "transform 0.15s ease" }}>
            {/* Edges */}
            <svg style={{ position: "absolute", inset: 0, width: 1400, height: 600, pointerEvents: "none" }}>
              {edges.filter(([f, t]) => filteredIds.has(f) && filteredIds.has(t)).map(([fId, tId], i) => {
                const fn = pipelineNodes.find(n => n.id === fId), tn = pipelineNodes.find(n => n.id === tId);
                if (!fn || !tn) return null;
                const fp = getNodePos(fn), tp = getNodePos(tn);
                const x1 = fp.x + NODE_W, y1 = fp.y + NODE_H / 2, x2 = tp.x, y2 = tp.y + NODE_H / 2, mx = (x1 + x2) / 2;
                const hl = selectedNode && (fId === selectedNode || tId === selectedNode);
                const grey = selectedNode && !hl;
                return <path key={i} d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`} fill="none"
                  stroke={hl ? statusColors[fn.status] : grey ? "#18181b" : "#27272a"} strokeWidth={hl ? 2.5 : 1.5}
                  strokeDasharray={fn.status === "error" ? "6 3" : "none"} opacity={grey ? 0.3 : 1} style={{ transition: "all 0.2s" }} />;
              })}
            </svg>

            {/* Column labels */}
            {Object.entries(groupColors).map(([k, v]) => {
              const cn = pipelineNodes.filter(n => n.group === k);
              if (!cn.length) return null;
              return <div key={k} style={{ position: "absolute", left: PAD_X + cn[0].col * COL_GAP, top: PAD_Y - 32, fontSize: 10, fontWeight: 700, color: v.accent, letterSpacing: 1.5, textTransform: "uppercase", opacity: 0.6 }}>{v.label}</div>;
            })}

            {/* Nodes */}
            {filteredNodes.map(node => {
              const pos = getNodePos(node), gc = groupColors[node.group];
              const isSel = selectedNode === node.id, isGrey = selectedNode && !highlightedNodes.has(node.id);
              const SIcon = statusIcons[node.status];
              return (
                <div key={node.id} onClick={(e: React.MouseEvent) => { e.stopPropagation(); setSelectedNode(isSel ? null : node.id); }}
                  style={{
                    position: "absolute", left: pos.x, top: pos.y, width: NODE_W, height: NODE_H,
                    background: isSel ? gc.bg : "#18181b", border: `1.5px solid ${isSel ? gc.accent : isGrey ? "#18181b" : "#27272a"}`,
                    borderRadius: 10, padding: "10px 12px", cursor: "pointer", transition: "all 0.15s",
                    opacity: isGrey ? 0.3 : 1, boxShadow: isSel ? `0 0 20px ${gc.accent}15` : "none", zIndex: isSel ? 10 : 1,
                    display: "flex", alignItems: "center", gap: 10,
                  } as React.CSSProperties}>
                  <div style={{ width: 32, height: 32, borderRadius: 7, flexShrink: 0, background: `${gc.accent}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: gc.accent, border: `1px solid ${gc.accent}30` }}>{node.icon}</div>
                  <div style={{ overflow: "hidden", flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 12.5, color: "#fafafa", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{node.label}</div>
                    {showLabels && <div style={{ fontSize: 11, color: "#52525b", marginTop: 1 }}>{node.records}</div>}
                  </div>
                  <SIcon size={13} color={statusColors[node.status]} style={{ flexShrink: 0 }} />
                </div>
              );
            })}
          </div>

          {/* Zoom controls */}
          <div style={{ position: "absolute", bottom: 16, left: 16, display: "flex", gap: 4, background: "#18181b", borderRadius: 8, border: "1px solid #27272a", padding: 3 }}>
            <button className="cv-btn" style={{ width: 30, height: 30, border: "none" }} onClick={() => setZoom(Math.min(zoom + 0.15, 2))}><ZoomIn size={14} /></button>
            <span style={{ display: "flex", alignItems: "center", padding: "0 6px", fontSize: 11, fontWeight: 600, color: "#71717a" }}>{Math.round(zoom * 100)}%</span>
            <button className="cv-btn" style={{ width: 30, height: 30, border: "none" }} onClick={() => setZoom(Math.max(zoom - 0.15, 0.4))}><ZoomOut size={14} /></button>
            <div style={{ width: 1, background: "#27272a", margin: "4px 2px" }} />
            <button className="cv-btn" style={{ width: 30, height: 30, border: "none" }} onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}><Maximize2 size={14} /></button>
            <button className={`cv-btn ${showLabels ? "active" : ""}`} style={{ width: 30, height: 30, border: "none" }} onClick={() => setShowLabels(!showLabels)}>
              {showLabels ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
          </div>

          {/* Status summary */}
          <div style={{ position: "absolute", bottom: 16, right: selected ? 356 : 16, display: "flex", gap: 14, background: "#18181b", borderRadius: 8, border: "1px solid #27272a", padding: "8px 16px", transition: "right 0.2s" }}>
            {[
              { label: "Healthy", count: pipelineNodes.filter(n => n.status === "healthy").length, color: "#22c55e" },
              { label: "Warning", count: pipelineNodes.filter(n => n.status === "warning").length, color: "#eab308" },
              { label: "Error", count: pipelineNodes.filter(n => n.status === "error").length, color: "#ef4444" },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.color }} />
                <span style={{ color: "#71717a" }}>{s.label}</span>
                <span style={{ fontWeight: 700, color: "#e4e4e7" }}>{s.count}</span>
              </div>
            ))}
            <span style={{ color: "#3f3f46" }}>|</span>
            <span style={{ fontSize: 12, color: "#71717a" }}>{pipelineNodes.length} nodes · {edges.length} edges</span>
          </div>
        </div>
      </div>

      {/* Inspector panel */}
      {selected && (
        <div className="inspector">
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #18181b", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: `${groupColors[selected.group].accent}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: groupColors[selected.group].accent, border: `1px solid ${groupColors[selected.group].accent}30` }}>{selected.icon}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14.5, color: "#fafafa" }}>{selected.label}</div>
                <div style={{ fontSize: 12, color: "#52525b", textTransform: "capitalize" }}>{selected.group} · {selected.type}</div>
              </div>
            </div>
            <button onClick={() => setSelectedNode(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#52525b", padding: 4 }}><X size={16} /></button>
          </div>

          <div style={{ padding: "16px 20px" }}>
            {/* Status banner */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: `${statusColors[selected.status]}10`, border: `1px solid ${statusColors[selected.status]}30`, borderRadius: 8, marginBottom: 20 }}>
              {(() => { const I = statusIcons[selected.status]; return <I size={15} color={statusColors[selected.status]} />; })()}
              <span style={{ fontWeight: 600, color: statusColors[selected.status], textTransform: "capitalize" }}>{selected.status}</span>
              <span style={{ marginLeft: "auto", fontSize: 12, color: "#52525b" }}>Last check: 2m ago</span>
            </div>

            {/* Properties */}
            <div style={{ fontSize: 10.5, fontWeight: 700, color: "#52525b", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 10 }}>Properties</div>
            {[
              { l: "Type", v: selected.type }, { l: "Records", v: selected.records }, { l: "Group", v: groupColors[selected.group].label },
              { l: "Upstream", v: `${edges.filter(([, t]) => t === selected.id).length} connections` },
              { l: "Downstream", v: `${edges.filter(([f]) => f === selected.id).length} connections` },
            ].map((f, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #18181b", fontSize: 13 }}>
                <span style={{ color: "#52525b" }}>{f.l}</span>
                <span style={{ fontWeight: 600, color: "#a1a1aa" }}>{f.v}</span>
              </div>
            ))}

            {/* Dependencies */}
            <div style={{ fontSize: 10.5, fontWeight: 700, color: "#52525b", letterSpacing: 1.2, textTransform: "uppercase", marginTop: 20, marginBottom: 10 }}>Dependencies</div>
            {edges.filter(([, t]) => t === selected.id).map(([fId], i) => {
              const fn = pipelineNodes.find(n => n.id === fId);
              return fn ? (
                <div key={i} onClick={() => setSelectedNode(fId)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: "#18181b", borderRadius: 6, marginBottom: 4, cursor: "pointer", fontSize: 12.5 }}>
                  <span style={{ color: groupColors[fn.group].accent, fontSize: 10, fontWeight: 800, width: 24 }}>{fn.icon}</span>
                  <span style={{ color: "#a1a1aa" }}>{fn.label}</span>
                  <ArrowRight size={12} color="#3f3f46" style={{ marginLeft: "auto" }} />
                </div>
              ) : null;
            })}
            {edges.filter(([, t]) => t === selected.id).length === 0 && <div style={{ fontSize: 12, color: "#3f3f46", padding: "8px 0" }}>No upstream dependencies</div>}

            {/* Dependents */}
            <div style={{ fontSize: 10.5, fontWeight: 700, color: "#52525b", letterSpacing: 1.2, textTransform: "uppercase", marginTop: 20, marginBottom: 10 }}>Dependents</div>
            {edges.filter(([f]) => f === selected.id).map(([, tId], i) => {
              const tn = pipelineNodes.find(n => n.id === tId);
              return tn ? (
                <div key={i} onClick={() => setSelectedNode(tId)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: "#18181b", borderRadius: 6, marginBottom: 4, cursor: "pointer", fontSize: 12.5 }}>
                  <span style={{ color: groupColors[tn.group].accent, fontSize: 10, fontWeight: 800, width: 24 }}>{tn.icon}</span>
                  <span style={{ color: "#a1a1aa" }}>{tn.label}</span>
                  <ArrowRight size={12} color="#3f3f46" style={{ marginLeft: "auto" }} />
                </div>
              ) : null;
            })}
            {edges.filter(([f]) => f === selected.id).length === 0 && <div style={{ fontSize: 12, color: "#3f3f46", padding: "8px 0" }}>No downstream dependents</div>}

            {/* Actions */}
            <div style={{ display: "flex", gap: 6, marginTop: 24 }}>
              <button style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "8px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, background: groupColors[selected.group].accent, color: "#09090b", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                <Eye size={13} /> Inspect
              </button>
              <button style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "8px 12px", borderRadius: 8, background: "#18181b", color: "#71717a", border: "1px solid #27272a", cursor: "pointer" }}><Code2 size={13} /></button>
              <button style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "8px 12px", borderRadius: 8, background: "#18181b", color: "#71717a", border: "1px solid #27272a", cursor: "pointer" }}><MoreHorizontal size={13} /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
