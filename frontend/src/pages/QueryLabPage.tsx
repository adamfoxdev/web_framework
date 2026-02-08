import { useState, useRef, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { Search, Play, ChevronDown, ChevronRight, Copy, Download, Clock, CheckCircle, AlertTriangle, XCircle, Database, Table2, Terminal, FileText, Maximize2, Minimize2, X, Plus, Save, Share2, Code2, Eye, Braces, ArrowUpDown, PanelLeftClose, PanelLeftOpen, PanelBottomClose, PanelBottomOpen, PanelRightClose, PanelRightOpen, RotateCcw, Star, Bookmark, Columns3, Hash, Type, Calendar, ToggleLeft, Grip, Loader2, Check, Info, Bug, Activity } from "lucide-react";

// ─── DATA ─────────────────────────────────────────────
const generateMetrics = () => Array.from({ length: 30 }, (_, i) => ({
  t: i, qps: Math.floor(Math.random() * 50 + 80 + Math.sin(i * 0.4) * 30),
  latency: Math.floor(Math.random() * 40 + 30 + Math.cos(i * 0.3) * 20),
  memory: Math.floor(Math.random() * 15 + 55 + i * 0.5),
  connections: Math.floor(Math.random() * 10 + 20),
}));

const schemaTables = [
  { name: "orders", schema: "public", cols: 14, rows: "12.4M", expanded: false,
    columns: [
      { name: "order_id", type: "VARCHAR(32)", pk: true, nullable: false },
      { name: "customer_id", type: "VARCHAR(32)", pk: false, nullable: false, fk: "customers.id" },
      { name: "amount", type: "DECIMAL(12,2)", pk: false, nullable: false },
      { name: "currency", type: "CHAR(3)", pk: false, nullable: false },
      { name: "status", type: "VARCHAR(20)", pk: false, nullable: false },
      { name: "created_at", type: "TIMESTAMP", pk: false, nullable: false },
      { name: "updated_at", type: "TIMESTAMP", pk: false, nullable: true },
    ]},
  { name: "customers", schema: "public", cols: 8, rows: "340K",
    columns: [
      { name: "id", type: "VARCHAR(32)", pk: true, nullable: false },
      { name: "company_name", type: "VARCHAR(128)", pk: false, nullable: false },
      { name: "email", type: "VARCHAR(255)", pk: false, nullable: true },
      { name: "tier", type: "VARCHAR(20)", pk: false, nullable: false },
      { name: "created_at", type: "TIMESTAMP", pk: false, nullable: false },
    ]},
  { name: "order_items", schema: "public", cols: 6, rows: "89.2M",
    columns: [
      { name: "item_id", type: "SERIAL", pk: true, nullable: false },
      { name: "order_id", type: "VARCHAR(32)", pk: false, nullable: false, fk: "orders.order_id" },
      { name: "product_id", type: "VARCHAR(32)", pk: false, nullable: false },
      { name: "quantity", type: "INTEGER", pk: false, nullable: false },
      { name: "unit_price", type: "DECIMAL(10,2)", pk: false, nullable: false },
    ]},
  { name: "products", schema: "public", cols: 12, rows: "45K",
    columns: [
      { name: "id", type: "VARCHAR(32)", pk: true, nullable: false },
      { name: "name", type: "VARCHAR(256)", pk: false, nullable: false },
      { name: "category", type: "VARCHAR(64)", pk: false, nullable: false },
      { name: "price", type: "DECIMAL(10,2)", pk: false, nullable: false },
    ]},
  { name: "payments", schema: "finance", cols: 10, rows: "8.1M",
    columns: [
      { name: "payment_id", type: "VARCHAR(32)", pk: true, nullable: false },
      { name: "order_id", type: "VARCHAR(32)", pk: false, nullable: false, fk: "orders.order_id" },
      { name: "method", type: "VARCHAR(20)", pk: false, nullable: false },
      { name: "amount", type: "DECIMAL(12,2)", pk: false, nullable: false },
      { name: "status", type: "VARCHAR(20)", pk: false, nullable: false },
    ]},
  { name: "refunds", schema: "finance", cols: 7, rows: "120K", columns: [] },
  { name: "sessions", schema: "analytics", cols: 9, rows: "34.2M", columns: [] },
  { name: "page_views", schema: "analytics", cols: 11, rows: "210M", columns: [] },
];

const queryResultSets = {
  "recent-orders": {
    columns: ["order_id", "customer", "amount", "status", "created", "region", "items", "channel"],
    rows: [
      { order_id: "ORD-78234", customer: "Acme Corp", amount: "$12,450.00", status: "completed", created: "2026-02-08 14:23", region: "us-east", items: 5, channel: "web" },
      { order_id: "ORD-78233", customer: "Globex Inc", amount: "$8,920.00", status: "completed", created: "2026-02-08 14:18", region: "eu-west", items: 3, channel: "api" },
      { order_id: "ORD-78232", customer: "Initech", amount: "$3,100.00", status: "processing", created: "2026-02-08 14:12", region: "us-west", items: 1, channel: "web" },
      { order_id: "ORD-78231", customer: "Umbrella Co", amount: "$45,600.00", status: "completed", created: "2026-02-08 13:55", region: "ap-south", items: 12, channel: "api" },
      { order_id: "ORD-78230", customer: "Stark Analytics", amount: "$1,800.00", status: "failed", created: "2026-02-08 13:41", region: "us-east", items: 1, channel: "web" },
    ],
    stats: { rows: 5, total: 1204, time: "0.34s", scanned: "2.4M", bytes: "12.4 KB", cost: "$0.003" },
  },
  "revenue": {
    columns: ["region", "total_revenue", "order_count", "avg_order", "pct_total"],
    rows: [
      { region: "us-east", total_revenue: "$2,340,120", order_count: "4,521", avg_order: "$518", pct_total: "38.2%" },
      { region: "eu-west", total_revenue: "$1,890,450", order_count: "3,210", avg_order: "$589", pct_total: "30.8%" },
      { region: "us-west", total_revenue: "$892,300", order_count: "1,890", avg_order: "$472", pct_total: "14.6%" },
      { region: "ap-south", total_revenue: "$674,200", order_count: "1,102", avg_order: "$612", pct_total: "11.0%" },
      { region: "other", total_revenue: "$334,800", order_count: "680", avg_order: "$492", pct_total: "5.4%" },
    ],
    stats: { rows: 5, total: 5, time: "1.82s", scanned: "12.4M", bytes: "1.2 MB", cost: "$0.012" },
  },
};

const initialTabs = [
  { id: "tab-1", name: "Recent Orders", saved: true, sql: `SELECT\n  o.order_id,\n  c.company_name AS customer,\n  FORMAT('$%,.2f', o.amount) AS amount,\n  o.status,\n  o.created_at AS created,\n  o.region,\n  COUNT(oi.item_id) AS items,\n  o.channel\nFROM orders o\nJOIN customers c ON o.customer_id = c.id\nLEFT JOIN order_items oi ON o.order_id = oi.order_id\nWHERE o.created_at >= CURRENT_DATE\nGROUP BY 1, 2, 3, 4, 5, 6, 8\nORDER BY o.created_at DESC\nLIMIT 100;`, resultKey: "recent-orders" },
  { id: "tab-2", name: "Revenue by Region", saved: true, sql: `SELECT\n  region,\n  FORMAT('$%,.0f', SUM(amount)) AS total_revenue,\n  FORMAT('%,.0f', COUNT(*)) AS order_count,\n  FORMAT('$%,.0f', AVG(amount)) AS avg_order,\n  FORMAT('%.1f%%', SUM(amount) * 100.0 / SUM(SUM(amount)) OVER()) AS pct_total\nFROM orders\nWHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)\nGROUP BY region\nORDER BY SUM(amount) DESC;`, resultKey: "revenue" },
  { id: "tab-3", name: "Untitled", saved: false, sql: `-- Write your query here\nSELECT `, resultKey: null },
];

const logEntries = [
  { time: "14:23:45.234", level: "INFO", source: "executor", msg: "Query executed successfully — 10 rows returned in 0.34s" },
  { time: "14:23:45.001", level: "DEBUG", source: "planner", msg: "Scanning partition: orders_2026_02 (est. 2.4M rows)" },
  { time: "14:23:44.892", level: "DEBUG", source: "planner", msg: "Query plan: Seq Scan → Hash Join → Filter → Sort → Limit" },
  { time: "14:23:44.512", level: "INFO", source: "executor", msg: "Executing query on warehouse: DW_PROD (us-east-1)" },
  { time: "14:23:44.102", level: "DEBUG", source: "optimizer", msg: "Cost estimation: 0.003 credits (within budget)" },
  { time: "14:22:31.445", level: "WARN", source: "executor", msg: "Previous query cancelled by user after 4.2s" },
  { time: "14:20:12.889", level: "INFO", source: "executor", msg: "Query executed successfully — 5 rows returned in 1.82s" },
  { time: "14:20:10.103", level: "DEBUG", source: "planner", msg: "Applying aggregate: SUM, COUNT, AVG over 12.4M rows" },
  { time: "14:18:55.667", level: "ERROR", source: "auth", msg: "Permission denied on schema 'finance_restricted' — requires role: finance_admin" },
  { time: "14:18:55.102", level: "INFO", source: "connector", msg: "Connecting to warehouse: DW_PROD (us-east-1)" },
];

const queryHistory = [
  { id: 1, sql: "SELECT * FROM orders WHERE created_at >= CURRENT_DATE...", time: "14:23", duration: "0.34s", rows: 10, status: "success" },
  { id: 2, sql: "SELECT region, SUM(amount) FROM orders GROUP BY...", time: "14:20", duration: "1.82s", rows: 5, status: "success" },
  { id: 3, sql: "SELECT * FROM finance_restricted.transactions...", time: "14:18", duration: "—", rows: null, status: "error" },
  { id: 4, sql: "DESCRIBE TABLE customers", time: "14:10", duration: "0.08s", rows: 8, status: "success" },
  { id: 5, sql: "SELECT COUNT(*) FROM order_items WHERE order_id...", time: "13:55", duration: "2.41s", rows: 1, status: "success" },
];

const savedQueries = [
  { id: 1, name: "Daily Revenue Summary", desc: "Revenue by region for current day", starred: true },
  { id: 2, name: "Customer Order History", desc: "Full order history for a given customer", starred: true },
  { id: 3, name: "Product Performance", desc: "Top products by revenue and quantity", starred: false },
  { id: 4, name: "Failed Payments Report", desc: "All failed payments in last 30 days", starred: false },
];

const warehouses = [
  { name: "DW_PROD", region: "us-east-1", size: "XL", status: "running", nodes: 8 },
  { name: "DW_DEV", region: "us-east-1", size: "M", status: "running", nodes: 2 },
  { name: "DW_STAGING", region: "eu-west-1", size: "L", status: "suspended", nodes: 4 },
];

// ─── RESIZABLE DIVIDER ───────────────────────────────
function Divider({ direction, onDrag }: { direction: string; onDrag: (delta: number) => void }) {
  const [dragging, setDragging] = useState(false);
  const startRef = useRef(0);
  const isHorizontal = direction === "horizontal";

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    startRef.current = isHorizontal ? e.clientX : e.clientY;
    const onMove = (me: MouseEvent) => {
      const delta = (isHorizontal ? me.clientX : me.clientY) - startRef.current;
      startRef.current = isHorizontal ? me.clientX : me.clientY;
      onDrag(delta);
    };
    const onUp = () => { setDragging(false); window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [isHorizontal, onDrag]);

  return (
    <div onMouseDown={onMouseDown} style={{
      [isHorizontal ? "width" : "height"]: 5,
      [isHorizontal ? "minWidth" : "minHeight"]: 5,
      cursor: isHorizontal ? "col-resize" : "row-resize",
      background: dragging ? "#58a6ff30" : "transparent",
      display: "flex", alignItems: "center", justifyContent: "center",
      transition: "background 0.15s", zIndex: 5, flexShrink: 0,
      borderLeft: isHorizontal ? "1px solid #21262d" : "none",
      borderTop: !isHorizontal ? "1px solid #21262d" : "none",
    }}
      onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.background = "#58a6ff15")}
      onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => { if (!dragging) e.currentTarget.style.background = "transparent"; }}>
      <Grip size={8} color="#484f58" style={{ transform: isHorizontal ? "rotate(90deg)" : "none" }} />
    </div>
  );
}

// ─── COLUMN TYPE ICONS ────────────────────────────────
function ColTypeIcon({ type }: { type: string }) {
  if (type.includes("VARCHAR") || type.includes("CHAR") || type.includes("TEXT")) return <Type size={11} color="#d29922" />;
  if (type.includes("INT") || type.includes("DECIMAL") || type.includes("SERIAL") || type.includes("NUMERIC")) return <Hash size={11} color="#58a6ff" />;
  if (type.includes("TIMESTAMP") || type.includes("DATE")) return <Calendar size={11} color="#a371f7" />;
  if (type.includes("BOOL")) return <ToggleLeft size={11} color="#3fb950" />;
  return <Columns3 size={11} color="#484f58" />;
}

// ─── MAIN COMPONENT ───────────────────────────────────
export default function QueryLabPage() {
  // Panel sizes (px)
  const [leftW, setLeftW] = useState(270);
  const [rightW, setRightW] = useState(240);
  const [bottomH, setBottomH] = useState(280);

  // Panel visibility
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [bottomOpen, setBottomOpen] = useState(true);
  const [maximizedPanel, setMaximizedPanel] = useState<string | null>(null);

  // State
  const [tabs, setTabs] = useState(initialTabs);
  const [activeTabId, setActiveTabId] = useState("tab-1");
  const [bottomPanel, setBottomPanel] = useState("results");
  const [sidePanel, setSidePanel] = useState("schema");
  const [isRunning, setIsRunning] = useState(false);
  const [expandedTables, setExpandedTables] = useState(new Set(["orders"]));
  const [schemaSearch, setSchemaSearch] = useState("");
  const [logFilter, setLogFilter] = useState("all");
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState("asc");
  const [resultPage, setResultPage] = useState(0);
  const [activeWarehouse, setActiveWarehouse] = useState("DW_PROD");
  const [showWhDropdown, setShowWhDropdown] = useState(false);
  const [metrics] = useState(generateMetrics);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
  const resultSet = activeTab.resultKey ? (queryResultSets as any)[activeTab.resultKey] : null;

  const updateTabSQL = (newSQL: string) => {
    setTabs(prevTabs =>
      prevTabs.map(t =>
        t.id === activeTabId ? { ...t, sql: newSQL, saved: false } : t
      )
    );
  };

  const runQuery = () => {
    setIsRunning(true);
    setBottomPanel("results");
    if (!bottomOpen) setBottomOpen(true);
    if (maximizedPanel === "editor") setMaximizedPanel(null);
    setTimeout(() => setIsRunning(false), 900);
  };

  const addTab = () => {
    const id = `tab-${Date.now()}`;
    setTabs([...tabs, { id, name: "Untitled", saved: false, sql: "-- New query\nSELECT ", resultKey: null }]);
    setActiveTabId(id);
  };

  const closeTab = (id: string) => {
    if (tabs.length <= 1) return;
    const idx = tabs.findIndex(t => t.id === id);
    const next = tabs.filter(t => t.id !== id);
    setTabs(next);
    if (activeTabId === id) setActiveTabId(next[Math.min(idx, next.length - 1)].id);
  };

  const toggleExpand = (name: string) => {
    const next = new Set(expandedTables);
    next.has(name) ? next.delete(name) : next.add(name);
    setExpandedTables(next);
  };

  const toggleMaximize = (panel: string): void => { setMaximizedPanel(maximizedPanel === panel ? null : panel); };

  const filteredTables = schemaTables.filter(t =>
    !schemaSearch || t.name.includes(schemaSearch.toLowerCase()) || t.schema.includes(schemaSearch.toLowerCase())
  );

  const filteredLogs = logFilter === "all" ? logEntries : logEntries.filter(l => l.level === logFilter.toUpperCase());

  const sortedRows = resultSet ? [...resultSet.rows].sort((a, b) => {
    if (!sortCol) return 0;
    const av = a[sortCol], bv = b[sortCol];
    const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
    return sortDir === "asc" ? cmp : -cmp;
  }) : [];

  const ROWS_PER_PAGE = 8;
  const pagedRows = sortedRows.slice(resultPage * ROWS_PER_PAGE, (resultPage + 1) * ROWS_PER_PAGE);
  const totalPages = resultSet ? Math.ceil(sortedRows.length / ROWS_PER_PAGE) : 0;

  const levelColors: Record<string, string> = { INFO: "#58a6ff", DEBUG: "#484f58", WARN: "#d29922", ERROR: "#f85149" };
  const levelIcons: Record<string, React.ElementType> = { INFO: Info, DEBUG: Bug, WARN: AlertTriangle, ERROR: XCircle };

  return (
    <div style={{
      display: "flex", flexDirection: "column", flex: 1, overflow: "hidden",
      fontFamily: "'IBM Plex Mono', 'Fira Code', monospace", background: "#0d1117", color: "#c9d1d9", fontSize: 13,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: #21262d; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #30363d; }
        ::-webkit-scrollbar-corner { background: #0d1117; }
        .tb { display: inline-flex; align-items: center; gap: 5px; padding: 5px 10px; border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.1s; border: 1px solid #21262d; background: #161b22; color: #8b949e; font-family: 'IBM Plex Sans', sans-serif; white-space: nowrap; }
        .tb:hover { background: #21262d; color: #c9d1d9; border-color: #30363d; }
        .tb.primary { background: #238636; border-color: #238636; color: white; }
        .tb.primary:hover { background: #2ea043; }
        .tb.danger { background: #da3633; border-color: #da3633; color: white; }
        .tb.flat { border: none; background: none; padding: 4px 6px; }
        .tb.flat:hover { background: #21262d; }
        .ptab { padding: 7px 14px; font-size: 12px; font-weight: 500; cursor: pointer; color: #484f58; border-bottom: 2px solid transparent; transition: all 0.1s; font-family: 'IBM Plex Sans', sans-serif; background: none; border-top: none; border-left: none; border-right: none; white-space: nowrap; }
        .ptab:hover { color: #8b949e; }
        .ptab.active { color: #58a6ff; border-bottom-color: #58a6ff; }
        .schema-row { display: flex; align-items: center; gap: 8px; padding: 5px 12px; cursor: pointer; transition: background 0.08s; font-size: 12.5px; }
        .schema-row:hover { background: #161b22; }
        .rcell { padding: 7px 12px; border-bottom: 1px solid #161b22; font-size: 12.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }
        .log-row { display: flex; gap: 10px; padding: 3px 14px; font-size: 12px; line-height: 1.65; align-items: flex-start; }
        .log-row:hover { background: #161b2240; }
        .tab-pill { display: flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 6px 6px 0 0; font-size: 12px; font-family: 'IBM Plex Sans', sans-serif; cursor: pointer; border: 1px solid transparent; border-bottom: none; transition: all 0.1s; }
        .tab-pill.active { background: #0d1117; border-color: #21262d; color: #e6edf3; }
        .tab-pill:not(.active) { background: transparent; color: #484f58; }
        .tab-pill:not(.active):hover { color: #8b949e; background: #161b2280; }
        .wh-dropdown { position: absolute; top: 100%; left: 0; right: 0; background: #161b22; border: 1px solid #30363d; border-radius: 8px; margin-top: 4px; z-index: 100; box-shadow: 0 12px 40px rgba(0,0,0,0.4); overflow: hidden; }
        .wh-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; cursor: pointer; transition: background 0.1s; font-size: 12.5px; }
        .wh-item:hover { background: #21262d; }
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>

      {/* ─── TOP TOOLBAR ─── */}
      <header style={{
        height: 46, minHeight: 46, background: "#161b22", borderBottom: "1px solid #21262d",
        display: "flex", alignItems: "center", padding: "0 10px", gap: 6,
      }}>
        <div style={{ width: 26, height: 26, borderRadius: 6, background: "linear-gradient(135deg, #238636, #3fb950)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Terminal size={13} color="white" />
        </div>
        <span style={{ fontFamily: "'IBM Plex Sans'", fontWeight: 700, fontSize: 14.5, color: "#e6edf3", marginRight: 12 }}>QueryLab</span>

        {/* Editor tabs */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 1, flex: 1, overflow: "auto", paddingTop: 6 }}>
          {tabs.map(t => (
            <div key={t.id} className={`tab-pill ${activeTabId === t.id ? "active" : ""}`}
              onClick={() => setActiveTabId(t.id)}>
              <Code2 size={12} />
              <span style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</span>
              {!t.saved && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#d29922", flexShrink: 0 }} />}
              {tabs.length > 1 && (
                <X size={12} style={{ opacity: 0.4, flexShrink: 0 }} onClick={e => { e.stopPropagation(); closeTab(t.id); }}
                  onMouseEnter={(e: React.MouseEvent<SVGSVGElement>) => (e.currentTarget.style.opacity = "1")} onMouseLeave={(e: React.MouseEvent<SVGSVGElement>) => (e.currentTarget.style.opacity = "0.4")} />
              )}
            </div>
          ))}
          <button className="tb flat" onClick={addTab} style={{ marginBottom: 1 }}><Plus size={14} /></button>
        </div>

        {/* Warehouse selector */}
        <div style={{ position: "relative" }}>
          <button className="tb" onClick={() => setShowWhDropdown(!showWhDropdown)} style={{ gap: 8 }}>
            <Database size={12} />
            <span style={{ color: "#e6edf3", fontWeight: 600 }}>{activeWarehouse}</span>
            <span style={{ fontSize: "10px", padding: "1px 5px", borderRadius: 3, background: warehouses.find(w => w.name === activeWarehouse)?.status === "running" ? "#23863620" : "#484f5820", color: warehouses.find(w => w.name === activeWarehouse)?.status === "running" ? "#3fb950" : "#8b949e" }}>
              {warehouses.find(w => w.name === activeWarehouse)?.size}
            </span>
            <ChevronDown size={12} />
          </button>
          {showWhDropdown && (
            <div className="wh-dropdown" style={{ width: 280 }}>
              <div style={{ padding: "8px 14px 4px", fontSize: 10, fontWeight: 600, color: "#484f58", letterSpacing: 1, textTransform: "uppercase", fontFamily: "'IBM Plex Sans'" }}>Warehouses</div>
              {warehouses.map(wh => (
                <div key={wh.name} className="wh-item" onClick={() => { setActiveWarehouse(wh.name); setShowWhDropdown(false); }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {activeWarehouse === wh.name && <Check size={13} color="#58a6ff" />}
                    {activeWarehouse !== wh.name && <div style={{ width: 13 }} />}
                    <div>
                      <div style={{ fontWeight: 600, color: "#e6edf3", fontFamily: "'IBM Plex Sans'" }}>{wh.name}</div>
                      <div style={{ fontSize: 11, color: "#484f58" }}>{wh.region} · {wh.nodes} nodes</div>
                    </div>
                  </div>
                  <span style={{
                    fontSize: 10, padding: "2px 7px", borderRadius: 4, fontWeight: 600,
                    background: wh.status === "running" ? "#23863620" : "#484f5815",
                    color: wh.status === "running" ? "#3fb950" : "#8b949e",
                  }}>{wh.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ width: 1, height: 20, background: "#21262d" }} />

        {/* Panel toggles */}
        <button className="tb flat" title="Toggle left panel" onClick={() => setLeftOpen(!leftOpen)}>
          {leftOpen ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
        </button>
        <button className="tb flat" title="Toggle bottom panel" onClick={() => setBottomOpen(!bottomOpen)}>
          {bottomOpen ? <PanelBottomClose size={14} /> : <PanelBottomOpen size={14} />}
        </button>
        <button className="tb flat" title="Toggle right panel" onClick={() => setRightOpen(!rightOpen)}>
          {rightOpen ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
        </button>

        <div style={{ width: 1, height: 20, background: "#21262d" }} />
        <button className="tb"><Save size={12} /> Save</button>
        <button className="tb flat"><Share2 size={13} /></button>
      </header>

      {/* ─── MAIN WORKSPACE ─── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ─── LEFT PANEL ─── */}
        {leftOpen && maximizedPanel !== "bottom" && maximizedPanel !== "editor" && (
          <>
            <div style={{ width: leftW, minWidth: 180, maxWidth: 500, display: "flex", flexDirection: "column", background: "#0d1117", overflow: "hidden" }}>
              {/* Side tabs */}
              <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #21262d", flexShrink: 0 }}>
                {[
                  { key: "schema", label: "Schema", icon: Database },
                  { key: "history", label: "History", icon: Clock },
                  { key: "saved", label: "Saved", icon: Bookmark },
                ].map(t => (
                  <button key={t.key} className={`ptab ${sidePanel === t.key ? "active" : ""}`}
                    onClick={() => setSidePanel(t.key)} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <t.icon size={12} /> {t.key === sidePanel ? t.label : ""}
                  </button>
                ))}
              </div>

              {/* Schema browser */}
              {sidePanel === "schema" && (
                <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
                  <div style={{ padding: "8px 10px", flexShrink: 0 }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 6, padding: "5px 8px",
                      background: "#161b22", borderRadius: 6, border: "1px solid #21262d",
                    }}>
                      <Search size={12} color="#484f58" />
                      <input value={schemaSearch} onChange={e => setSchemaSearch(e.target.value)}
                        placeholder="Filter tables..."
                        style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#c9d1d9", fontSize: 12, fontFamily: "inherit" }} />
                      {schemaSearch && <X size={12} color="#484f58" style={{ cursor: "pointer" }} onClick={() => setSchemaSearch("")} />}
                    </div>
                  </div>
                  <div style={{ flex: 1, overflow: "auto" }}>
                    {["public", "finance", "analytics"].map(schema => {
                      const tables = filteredTables.filter(t => t.schema === schema);
                      if (!tables.length) return null;
                      return (
                        <div key={schema}>
                          <div style={{ padding: "6px 12px", fontSize: 10, fontWeight: 700, color: "#484f58", letterSpacing: 1.2, textTransform: "uppercase", fontFamily: "'IBM Plex Sans'" }}>
                            {schema} ({tables.length})
                          </div>
                          {tables.map(table => (
                            <div key={table.name}>
                              <div className="schema-row" onClick={() => toggleExpand(table.name)}>
                                {expandedTables.has(table.name) ? <ChevronDown size={12} color="#484f58" /> : <ChevronRight size={12} color="#484f58" />}
                                <Table2 size={13} color="#58a6ff" />
                                <span style={{ flex: 1, color: "#c9d1d9", fontSize: 12.5 }}>{table.name}</span>
                                <span style={{ fontSize: 10, color: "#484f58", fontFamily: "'IBM Plex Sans'" }}>{table.rows}</span>
                              </div>
                              {expandedTables.has(table.name) && table.columns && (
                                <div style={{ paddingLeft: 20 }}>
                                  {table.columns.map((col, ci) => (
                                    <div key={ci} style={{
                                      display: "flex", alignItems: "center", gap: 5,
                                      padding: "3px 12px", fontSize: 12, color: "#8b949e",
                                    }}>
                                      <ColTypeIcon type={col.type} />
                                      <span style={{ color: col.pk ? "#d29922" : "#c9d1d9", fontWeight: col.pk ? 600 : 400 }}>{col.name}</span>
                                      {col.pk && <span style={{ fontSize: 9, color: "#d29922", background: "#d2992215", padding: "0 4px", borderRadius: 2, fontWeight: 700 }}>PK</span>}
                                      {col.fk && <span style={{ fontSize: 9, color: "#58a6ff", background: "#58a6ff15", padding: "0 4px", borderRadius: 2 }}>FK</span>}
                                      {col.nullable && <span style={{ fontSize: 9, color: "#484f58" }}>?</span>}
                                      <span style={{ marginLeft: "auto", fontSize: 10, color: "#30363d" }}>{col.type}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* History */}
              {sidePanel === "history" && (
                <div style={{ flex: 1, overflow: "auto" }}>
                  {queryHistory.map(h => (
                    <div key={h.id} style={{
                      padding: "10px 14px", borderBottom: "1px solid #161b22",
                      cursor: "pointer", transition: "background 0.1s",
                    }} onMouseEnter={e => e.currentTarget.style.background = "#161b22"}
                       onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        {h.status === "success" ? <CheckCircle size={11} color="#3fb950" /> : <XCircle size={11} color="#f85149" />}
                        <span style={{ fontSize: 11, color: "#484f58", fontFamily: "'IBM Plex Sans'" }}>{h.time} · {h.duration}</span>
                        {h.rows !== null && <span style={{ fontSize: 11, color: "#484f58" }}>· {h.rows} rows</span>}
                      </div>
                      <div style={{ fontSize: 11.5, color: "#8b949e", fontFamily: "'IBM Plex Mono'", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {h.sql}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Saved queries */}
              {sidePanel === "saved" && (
                <div style={{ flex: 1, overflow: "auto" }}>
                  {savedQueries.map(sq => (
                    <div key={sq.id} style={{
                      padding: "10px 14px", borderBottom: "1px solid #161b22",
                      cursor: "pointer", transition: "background 0.1s",
                    }} onMouseEnter={e => e.currentTarget.style.background = "#161b22"}
                       onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Star size={12} fill={sq.starred ? "#d29922" : "none"} color={sq.starred ? "#d29922" : "#30363d"} />
                        <span style={{ fontWeight: 600, fontSize: 13, color: "#e6edf3", fontFamily: "'IBM Plex Sans'" }}>{sq.name}</span>
                      </div>
                      <div style={{ fontSize: 11.5, color: "#484f58", marginTop: 3, fontFamily: "'IBM Plex Sans'" }}>{sq.desc}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Divider direction="horizontal" onDrag={(d: number) => setLeftW(w => Math.max(180, Math.min(500, w + d)))} />
          </>
        )}

        {/* ─── CENTER ─── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

          {/* ─── EDITOR ─── */}
          {(maximizedPanel !== "bottom") && (
            <div style={{ flex: maximizedPanel === "editor" ? 1 : undefined, height: maximizedPanel === "editor" ? undefined : (bottomOpen ? `calc(100% - ${bottomH}px)` : "100%"), minHeight: 120, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              {/* Editor toolbar */}
              <div style={{
                height: 38, minHeight: 38, background: "#161b22", borderBottom: "1px solid #21262d",
                display: "flex", alignItems: "center", padding: "0 10px", gap: 5, flexShrink: 0,
              }}>
                <button className={`tb ${isRunning ? "danger" : "primary"}`} onClick={runQuery} style={{ padding: "5px 14px" }}>
                  {isRunning ? <><Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> Running...</> : <><Play size={12} /> Run</>}
                </button>
                <button className="tb"><Braces size={12} /> Format</button>
                <button className="tb"><Eye size={12} /> Explain</button>
                <button className="tb flat"><RotateCcw size={12} /></button>
                <div style={{ flex: 1 }} />
                {resultSet && (
                  <span style={{ fontSize: 11, color: "#484f58", fontFamily: "'IBM Plex Sans'", display: "flex", alignItems: "center", gap: 6 }}>
                    {isRunning ? (
                      <><Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> Executing...</>
                    ) : (
                      <><CheckCircle size={12} color="#3fb950" /> {resultSet.stats.rows} rows · {resultSet.stats.time}</>
                    )}
                  </span>
                )}
                <button className="tb flat" title={maximizedPanel === "editor" ? "Restore" : "Maximize"} onClick={() => toggleMaximize("editor")}>
                  {maximizedPanel === "editor" ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                </button>
              </div>

              {/* SQL editor area */}
              <div style={{ flex: 1, overflow: "hidden", display: "flex", background: "#0d1117", position: "relative" }}>
                <Editor
                  height="100%"
                  defaultLanguage="sql"
                  value={activeTab.sql}
                  onChange={(value) => updateTabSQL(value || "")}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13.5,
                    lineHeight: 28,
                    fontFamily: "'IBM Plex Mono', 'Fira Code', monospace",
                    fontLigatures: true,
                    wordWrap: "on",
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    insertSpaces: true,
                    formatOnPaste: true,
                    copyWithSyntaxHighlighting: true,
                    quickSuggestions: { other: true, comments: false, strings: false },
                    suggestOnTriggerCharacters: true,
                  }}
                />
              </div>
            </div>
          )}

          {/* ─── BOTTOM PANEL ─── */}
          {bottomOpen && maximizedPanel !== "editor" && (
            <>
              {maximizedPanel !== "bottom" && <Divider direction="vertical" onDrag={(d: number) => setBottomH(h => Math.max(120, Math.min(600, h - d)))} />}
              <div style={{ height: maximizedPanel === "bottom" ? "100%" : bottomH, minHeight: 120, display: "flex", flexDirection: "column", background: "#0d1117", overflow: "hidden" }}>
                {/* Bottom tabs */}
                <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #21262d", background: "#161b22", flexShrink: 0 }}>
                  {[
                    { key: "results", label: `Results${resultSet ? ` (${resultSet.stats.rows})` : ""}`, icon: Table2 },
                    { key: "logs", label: `Logs (${filteredLogs.length})`, icon: FileText },
                    { key: "metrics", label: "Metrics", icon: Activity },
                  ].map(t => (
                    <button key={t.key} className={`ptab ${bottomPanel === t.key ? "active" : ""}`}
                      onClick={() => setBottomPanel(t.key)} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <t.icon size={12} /> {t.label}
                    </button>
                  ))}
                  <div style={{ flex: 1 }} />
                  {bottomPanel === "logs" && (
                    <div style={{ display: "flex", gap: 2, marginRight: 4 }}>
                      {["all", "info", "warn", "error", "debug"].map(f => (
                        <button key={f} className="tb flat" onClick={() => setLogFilter(f)} style={{
                          fontSize: 10, padding: "2px 7px", textTransform: "uppercase", fontWeight: 600, letterSpacing: 0.5,
                          color: logFilter === f ? (f === "error" ? "#f85149" : f === "warn" ? "#d29922" : "#58a6ff") : "#484f58",
                          background: logFilter === f ? "#21262d" : "transparent", borderRadius: 4,
                        }}>{f}</button>
                      ))}
                    </div>
                  )}
                  {bottomPanel === "results" && resultSet && (
                    <>
                      <button className="tb flat" title="Copy results" onClick={() => {
                        if (!resultSet) return;
                        const header = resultSet.columns.join("\t");
                        const rows = sortedRows.map((r: any) => resultSet.columns.map((c: string) => r[c]).join("\t")).join("\n");
                        navigator.clipboard.writeText(header + "\n" + rows);
                      }}><Copy size={12} /></button>
                      <button className="tb flat" title="Export CSV"><Download size={12} /></button>
                    </>
                  )}
                  <button className="tb flat" title={maximizedPanel === "bottom" ? "Restore" : "Maximize"} onClick={() => toggleMaximize("bottom")}>
                    {maximizedPanel === "bottom" ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                  </button>
                </div>

                {/* Bottom content */}
                <div style={{ flex: 1, overflow: "auto" }}>
                  {/* Results */}
                  {bottomPanel === "results" && resultSet && (
                    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                      <div style={{ flex: 1, overflow: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ position: "sticky", top: 0, background: "#161b22", zIndex: 2 }}>
                              <th className="rcell" style={{ color: "#484f58", fontSize: 11, textAlign: "center", width: 40 }}>#</th>
                              {resultSet.columns.map((col: string) => (
                                <th key={col} className="rcell" onClick={() => { setSortDir(sortCol === col && sortDir === "asc" ? "desc" : "asc"); setSortCol(col); }}
                                  style={{ color: sortCol === col ? "#58a6ff" : "#484f58", fontSize: 11, fontWeight: 600, letterSpacing: 0.3, textAlign: "left", cursor: "pointer", userSelect: "none" }}>
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                                    {col} <ArrowUpDown size={10} style={{ opacity: sortCol === col ? 1 : 0.3 }} />
                                  </span>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {pagedRows.map((row, ri) => (
                              <tr key={ri} onMouseEnter={e => e.currentTarget.style.background = "#161b22"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                <td className="rcell" style={{ textAlign: "center", color: "#484f58", fontSize: 11 }}>{String(resultPage * ROWS_PER_PAGE + ri + 1)}</td>
                                {resultSet.columns.map((col: string) => (
                                  <td key={col} className="rcell" style={{
                                    color: col === "status"
                                      ? (row[col] === "completed" ? "#3fb950" : row[col] === "failed" ? "#f85149" : "#d29922")
                                      : col === "amount" || col === "total_revenue" ? "#e6edf3" : "#8b949e",
                                    fontWeight: col === "amount" || col === "total_revenue" ? 600 : 400,
                                  }}>{row[col]}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {/* Pagination + stats */}
                      <div style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "6px 14px", borderTop: "1px solid #21262d", background: "#161b22", flexShrink: 0,
                        fontFamily: "'IBM Plex Sans'", fontSize: 11.5, color: "#484f58",
                      }}>
                        <div style={{ display: "flex", gap: 12 }}>
                          <span>Rows: <span style={{ color: "#8b949e" }}>{resultSet.stats.rows} / {resultSet.stats.total}</span></span>
                          <span>Time: <span style={{ color: "#8b949e" }}>{resultSet.stats.time}</span></span>
                          <span>Scanned: <span style={{ color: "#8b949e" }}>{resultSet.stats.scanned}</span></span>
                          <span>Cost: <span style={{ color: "#3fb950" }}>{resultSet.stats.cost}</span></span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <button className="tb flat" disabled={resultPage === 0} onClick={() => setResultPage(p => p - 1)} style={{ padding: "2px 8px", fontSize: 11 }}>← Prev</button>
                          <span>{resultPage + 1} / {totalPages}</span>
                          <button className="tb flat" disabled={resultPage >= totalPages - 1} onClick={() => setResultPage(p => p + 1)} style={{ padding: "2px 8px", fontSize: 11 }}>Next →</button>
                        </div>
                      </div>
                    </div>
                  )}
                  {bottomPanel === "results" && !resultSet && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#30363d", fontFamily: "'IBM Plex Sans'", flexDirection: "column", gap: 8 }}>
                      <Play size={24} /> <span>Run a query to see results</span>
                    </div>
                  )}

                  {/* Logs */}
                  {bottomPanel === "logs" && (
                    <div style={{ padding: "4px 0" }}>
                      {filteredLogs.map((log, i) => {
                        const LIcon = (levelIcons[log.level] || Info) as React.ElementType;
                        return (
                          <div key={i} className="log-row">
                            <span style={{ color: "#30363d", minWidth: 90, fontSize: 11.5, fontFamily: "'IBM Plex Mono'" }}>{log.time}</span>
                            <span style={{ display: "flex", alignItems: "center", gap: 3, minWidth: 55 }}>
                              <LIcon size={11} color={levelColors[log.level]} />
                              <span style={{ fontWeight: 600, fontSize: 10.5, color: levelColors[log.level], letterSpacing: 0.3 }}>{log.level}</span>
                            </span>
                            <span style={{ fontSize: 10.5, color: "#484f58", background: "#161b22", padding: "0 5px", borderRadius: 3, fontFamily: "'IBM Plex Sans'" }}>{log.source}</span>
                            <span style={{ color: log.level === "ERROR" ? "#f85149" : "#8b949e", flex: 1 }}>{log.msg}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Metrics */}
                  {bottomPanel === "metrics" && (
                    <div style={{ padding: 14, display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, height: "100%" }}>
                      {[
                        { key: "qps", label: "Queries/sec", color: "#58a6ff", current: "142" },
                        { key: "latency", label: "Avg Latency (ms)", color: "#3fb950", current: "48" },
                        { key: "memory", label: "Memory %", color: "#d29922", current: "68%" },
                        { key: "connections", label: "Active Connections", color: "#a371f7", current: "26" },
                      ].map((m: any) => (
                        <div key={m.key} style={{ display: "flex", flexDirection: "column" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, fontFamily: "'IBM Plex Sans'" }}>
                            <span style={{ fontSize: 11.5, fontWeight: 600, color: "#484f58" }}>{m.label}</span>
                            <span style={{ fontSize: 16, fontWeight: 700, color: m.color }}>{m.current}</span>
                          </div>
                          <div style={{ flex: 1, minHeight: 0 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={metrics}>
                                <defs>
                                  <linearGradient id={`g-${m.key}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={m.color} stopOpacity={0.2} />
                                    <stop offset="100%" stopColor={m.color} stopOpacity={0} />
                                  </linearGradient>
                                </defs>
                                <XAxis dataKey="t" hide />
                                <YAxis hide />
                                <Area type="monotone" dataKey={m.key} stroke={m.color} fill={`url(#g-${m.key})`} strokeWidth={1.5} />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ─── RIGHT PANEL ─── */}
        {rightOpen && maximizedPanel !== "bottom" && maximizedPanel !== "editor" && (
          <>
            <Divider direction="horizontal" onDrag={(d: number) => setRightW(w => Math.max(180, Math.min(400, w - d)))} />
            <div style={{ width: rightW, minWidth: 180, maxWidth: 400, background: "#0d1117", display: "flex", flexDirection: "column", overflow: "auto" }}>

              <div style={{ padding: "12px 14px", borderBottom: "1px solid #21262d" }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: "#484f58", letterSpacing: 1, textTransform: "uppercase", fontFamily: "'IBM Plex Sans'", marginBottom: 8 }}>Connection</div>
                {[
                  { l: "Warehouse", v: activeWarehouse, c: "#e6edf3" },
                  { l: "Region", v: warehouses.find(w => w.name === activeWarehouse)?.region || "—" },
                  { l: "Compute", v: `${warehouses.find(w => w.name === activeWarehouse)?.size || "—"} (${warehouses.find(w => w.name === activeWarehouse)?.nodes || 0} nodes)` },
                  { l: "Status", v: warehouses.find(w => w.name === activeWarehouse)?.status === "running" ? "● Connected" : "○ Suspended", c: warehouses.find(w => w.name === activeWarehouse)?.status === "running" ? "#3fb950" : "#8b949e" },
                ].map((f, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 12 }}>
                    <span style={{ color: "#484f58" }}>{f.l}</span>
                    <span style={{ color: f.c || "#8b949e", fontWeight: 500 }}>{f.v}</span>
                  </div>
                ))}
              </div>

              {resultSet && (
                <div style={{ padding: "12px 14px", borderBottom: "1px solid #21262d" }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: "#484f58", letterSpacing: 1, textTransform: "uppercase", fontFamily: "'IBM Plex Sans'", marginBottom: 8 }}>Query Stats</div>
                  {[
                    { l: "Duration", v: resultSet.stats.time },
                    { l: "Rows Returned", v: String(resultSet.stats.rows) },
                    { l: "Total Matching", v: String(resultSet.stats.total) },
                    { l: "Data Scanned", v: resultSet.stats.scanned },
                    { l: "Bytes Out", v: resultSet.stats.bytes },
                    { l: "Estimated Cost", v: resultSet.stats.cost, c: "#3fb950" },
                  ].map((f, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 12 }}>
                      <span style={{ color: "#484f58" }}>{f.l}</span>
                      <span style={{ color: f.c || "#e6edf3", fontWeight: 600, fontFamily: "'IBM Plex Mono'" }}>{f.v}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ padding: "12px 14px" }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: "#484f58", letterSpacing: 1, textTransform: "uppercase", fontFamily: "'IBM Plex Sans'", marginBottom: 8 }}>Session</div>
                {[
                  { l: "User", v: "sarah.chen" },
                  { l: "Role", v: "analyst" },
                  { l: "Queries Today", v: "47" },
                  { l: "Credits Used", v: "$0.84" },
                ].map((f, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 12 }}>
                    <span style={{ color: "#484f58" }}>{f.l}</span>
                    <span style={{ color: "#8b949e", fontWeight: 500 }}>{f.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
