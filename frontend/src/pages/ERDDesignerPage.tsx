import { useState, useEffect, useRef } from 'react';
import { Database, ZoomIn, ZoomOut, Download, Settings, GripHorizontal, Eye, EyeOff, RotateCcw, Maximize2 } from 'lucide-react';
import '../styles/erd.css';

interface Column {
  name: string;
  type: string;
  nullable?: boolean;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
}

interface Entity {
  name: string;
  columns: Column[];
  description?: string;
}

interface Relationship {
  from: string;
  to: string;
  fromColumn: string;
  toColumn: string;
  type: 'one-to-many' | 'one-to-one' | 'many-to-many';
}

interface EntityPosition {
  [key: string]: { x: number; y: number };
}

export default function ERDDesignerPage() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [entityPositions, setEntityPositions] = useState<EntityPosition>({});
  const [draggingEntity, setDraggingEntity] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showRelationships, setShowRelationships] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Mock database schema
  const mockSchema: Entity[] = [
    {
      name: 'Users',
      description: 'System users',
      columns: [
        { name: 'Id', type: 'GUID', isPrimaryKey: true },
        { name: 'Username', type: 'VARCHAR(100)', nullable: false },
        { name: 'Email', type: 'VARCHAR(100)', nullable: false },
        { name: 'PasswordHash', type: 'VARCHAR(255)', nullable: false },
        { name: 'FirstName', type: 'VARCHAR(100)' },
        { name: 'LastName', type: 'VARCHAR(100)' },
        { name: 'IsActive', type: 'BIT', nullable: false },
        { name: 'CreatedAt', type: 'DATETIME2' },
      ],
    },
    {
      name: 'Workspaces',
      description: 'Workspace containers',
      columns: [
        { name: 'Id', type: 'GUID', isPrimaryKey: true },
        { name: 'Name', type: 'VARCHAR(200)', nullable: false },
        { name: 'Description', type: 'VARCHAR(1000)' },
        { name: 'Department', type: 'VARCHAR(100)' },
        { name: 'IsDefault', type: 'BIT' },
        { name: 'CreatedBy', type: 'VARCHAR(100)' },
        { name: 'CreatedAt', type: 'DATETIME2' },
        { name: 'UpdatedAt', type: 'DATETIME2' },
      ],
    },
    {
      name: 'Reports',
      description: 'Report definitions',
      columns: [
        { name: 'Id', type: 'GUID', isPrimaryKey: true },
        { name: 'WorkspaceId', type: 'GUID', isForeignKey: true },
        { name: 'Name', type: 'VARCHAR(200)', nullable: false },
        { name: 'Description', type: 'VARCHAR(1000)' },
        { name: 'Type', type: 'VARCHAR(50)' },
        { name: 'Status', type: 'VARCHAR(50)' },
        { name: 'QuerySql', type: 'NVARCHAR(MAX)' },
        { name: 'Schedule', type: 'VARCHAR(50)' },
        { name: 'LastRunAt', type: 'DATETIME2' },
        { name: 'CreatedAt', type: 'DATETIME2' },
      ],
    },
    {
      name: 'DataProjects',
      description: 'Data project containers',
      columns: [
        { name: 'Id', type: 'GUID', isPrimaryKey: true },
        { name: 'WorkspaceId', type: 'GUID', isForeignKey: true },
        { name: 'Name', type: 'VARCHAR(200)', nullable: false },
        { name: 'Description', type: 'VARCHAR(1000)' },
        { name: 'Category', type: 'VARCHAR(100)' },
        { name: 'IsPublic', type: 'BIT' },
        { name: 'CreatedBy', type: 'VARCHAR(100)' },
        { name: 'CreatedAt', type: 'DATETIME2' },
      ],
    },
    {
      name: 'SavedQueries',
      description: 'Saved SQL queries',
      columns: [
        { name: 'Id', type: 'GUID', isPrimaryKey: true },
        { name: 'WorkspaceId', type: 'GUID', isForeignKey: true },
        { name: 'Name', type: 'VARCHAR(200)', nullable: false },
        { name: 'QuerySql', type: 'NVARCHAR(MAX)' },
        { name: 'Description', type: 'VARCHAR(1000)' },
        { name: 'SavedAt', type: 'DATETIME2' },
        { name: 'LastExecutedAt', type: 'DATETIME2' },
      ],
    },
  ];

  const mockRelationships: Relationship[] = [
    { from: 'Workspaces', to: 'Reports', fromColumn: 'Id', toColumn: 'WorkspaceId', type: 'one-to-many' },
    { from: 'Workspaces', to: 'DataProjects', fromColumn: 'Id', toColumn: 'WorkspaceId', type: 'one-to-many' },
    { from: 'Workspaces', to: 'SavedQueries', fromColumn: 'Id', toColumn: 'WorkspaceId', type: 'one-to-many' },
  ];

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setEntities(mockSchema);
      setRelationships(mockRelationships);
      // Initialize positions
      const initialPositions: EntityPosition = {};
      mockSchema.forEach((entity, idx) => {
        initialPositions[entity.name] = {
          x: (idx % 3) * 320 + 40,
          y: Math.floor(idx / 3) * 300 + 40,
        };
      });
      setEntityPositions(initialPositions);
      setLoading(false);
    }, 500);
  }, []);

  const handleMouseDown = (entityName: string, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, textarea, select')) return;
    setDraggingEntity(entityName);
    const pos = entityPositions[entityName] || { x: 0, y: 0 };
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left - pos.x,
        y: e.clientY - rect.top - pos.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingEntity || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const newX = Math.max(0, (e.clientX - rect.left) / zoom - dragOffset.x);
    const newY = Math.max(0, (e.clientY - rect.top) / zoom - dragOffset.y);
    setEntityPositions(prev => ({
      ...prev,
      [draggingEntity]: { x: newX, y: newY }
    }));
  };

  const handleMouseUp = () => {
    setDraggingEntity(null);
  };

  const handleResetLayout = () => {
    const initialPositions: EntityPosition = {};
    entities.forEach((entity, idx) => {
      initialPositions[entity.name] = {
        x: (idx % 3) * 320 + 40,
        y: Math.floor(idx / 3) * 300 + 40,
      };
    });
    setEntityPositions(initialPositions);
  };

  const handleZoomToFit = () => {
    setZoom(0.8);
  };

  const handleExportDiagram = () => {
    alert('Export functionality would generate an image/SVG of the ERD');
  };

  const filteredEntities = entities.filter(e => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '100%', margin: 0, height: '100vh', display: 'flex', flexDirection: 'column' }} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <Database size={28} color="#2563eb" />
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5, marginBottom: 0 }}>
            Entity Relationship Diagram Designer
          </h1>
        </div>
        <p style={{ color: '#64748b', fontSize: 13, marginBottom: 0 }}>
          Drag entities to reposition • Click to select • View relationships and metadata
        </p>
      </div>

      {/* Toolbar */}
      <div style={{ padding: '12px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="btn btn-sm" onClick={() => setZoom(z => Math.min(z + 0.2, 2))}>
          <ZoomIn size={16} /> Zoom In
        </button>
        <button className="btn btn-sm" onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))}>
          <ZoomOut size={16} /> Zoom Out
        </button>
        <button className="btn btn-sm" onClick={handleZoomToFit}>
          <Maximize2 size={16} /> Fit All
        </button>
        <div style={{ width: 1, height: 24, background: '#e2e8f0', margin: '0 4px' }} />
        <button className="btn btn-sm" onClick={() => setShowRelationships(!showRelationships)}>
          {showRelationships ? <Eye size={16} /> : <EyeOff size={16} />} 
          {showRelationships ? ' Hide' : ' Show'} Relations
        </button>
        <button className="btn btn-sm" onClick={handleResetLayout}>
          <RotateCcw size={16} /> Reset Layout
        </button>
        <button className="btn btn-sm" onClick={handleExportDiagram}>
          <Download size={16} /> Export
        </button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search entities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '6px 12px',
              border: '1px solid #e2e8f0',
              borderRadius: 6,
              fontSize: 12,
              width: 180,
            }}
          />
          <button 
            className="btn btn-sm"
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            style={{ background: showAdvancedOptions ? '#3b82f6' : undefined, color: showAdvancedOptions ? '#fff' : undefined }}
          >
            <Settings size={16} /> Options
          </button>
          <span style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>
            {filteredEntities.length} entities • {relationships.length} relations • {zoom.toFixed(1)}x
          </span>
        </div>
      </div>

      {/* Advanced Options Panel */}
      {showAdvancedOptions && (
        <div style={{ padding: '12px 24px', borderBottom: '1px solid #e2e8f0', background: '#f0f9ff', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 8, color: '#1e293b' }}>Display Options</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked style={{ width: 16, height: 16 }} />
                <span>Show column types</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked style={{ width: 16, height: 16 }} />
                <span>Show cardinality</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked style={{ width: 16, height: 16 }} />
                <span>Show entity descriptions</span>
              </label>
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 8, color: '#1e293b' }}>Relationship Styles</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
                <input type="radio" name="lineStyle" value="straight" defaultChecked style={{ width: 16, height: 16 }} />
                <span>Straight lines</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
                <input type="radio" name="lineStyle" value="curved" style={{ width: 16, height: 16 }} />
                <span>Curved lines</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
                <input type="radio" name="lineStyle" value="orthogonal" style={{ width: 16, height: 16 }} />
                <span>Orthogonal lines</span>
              </label>
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 8, color: '#1e293b' }}>Export Format</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-sm" onClick={() => alert('PNG export')}>PNG</button>
              <button className="btn btn-sm" onClick={() => alert('SVG export')}>SVG</button>
              <button className="btn btn-sm" onClick={() => alert('PDF export')}>PDF</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: '#fafbfc' }}>
        {/* Canvas */}
        <div 
          ref={canvasRef}
          style={{ 
            flex: 1, 
            overflow: 'auto', 
            padding: 24, 
            position: 'relative',
            cursor: draggingEntity ? 'grabbing' : 'grab',
            userSelect: 'none',
          }}
        >
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: 14 }}>Loading schema...</div>
              </div>
            </div>
          ) : (
            <>
              <svg
                style={{
                  width: '100%',
                  height: '100%',
                  minHeight: 600,
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  zIndex: 0,
                  pointerEvents: 'none',
                }}
              >
                {showRelationships && relationships.map((rel, idx) => {
                  const fromPos = entityPositions[rel.from];
                  const toPos = entityPositions[rel.to];
                  if (!fromPos || !toPos) return null;

                  const fromX = fromPos.x + 140;
                  const fromY = fromPos.y + 80;
                  const toX = toPos.x + 140;
                  const toY = toPos.y + 80;

                  return (
                    <g key={idx}>
                      <line
                        x1={fromX} y1={fromY}
                        x2={toX} y2={toY}
                        stroke="#cbd5e1"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                        opacity={0.6}
                      />
                      <circle cx={toX} cy={toY} r="5" fill="#818cf8" opacity={0.7} />
                    </g>
                  );
                })}
              </svg>

              {/* Entity cards */}
              <div style={{ position: 'relative', zIndex: 1 }}>
                {filteredEntities.map((entity) => {
                  const pos = entityPositions[entity.name] || { x: 0, y: 0 };
                  return (
                    <div
                      key={entity.name}
                      className="card"
                      onMouseDown={(e) => handleMouseDown(entity.name, e)}
                      onClick={() => setSelectedEntity(entity.name)}
                      style={{
                        cursor: 'grab',
                        position: 'absolute',
                        left: pos.x * zoom,
                        top: pos.y * zoom,
                        width: 280,
                        transform: `scale(${zoom})`,
                        transformOrigin: 'top left',
                        border: selectedEntity === entity.name ? '2px solid #2563eb' : '1px solid #e2e8f0',
                        boxShadow: selectedEntity === entity.name ? '0 0 0 3px rgba(37, 99, 235, 0.1)' : undefined,
                        transition: draggingEntity === entity.name ? 'none' : 'all 200ms ease',
                        userSelect: 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #e2e8f0' }}>
                        <GripHorizontal size={16} color="#94a3b8" style={{ cursor: 'grab' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{entity.name}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{entity.description}</div>
                        </div>
                      </div>

                      {/* Columns */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
                        {entity.columns.slice(0, 8).map((col) => (
                          <div
                            key={col.name}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              padding: '4px 6px',
                              background: col.isPrimaryKey ? '#eff6ff' : col.isForeignKey ? '#f0fdf4' : '#f8fafc',
                              borderRadius: 4,
                              fontSize: 11,
                            }}
                          >
                            <span style={{
                              width: 5,
                              height: 5,
                              borderRadius: '50%',
                              background: col.isPrimaryKey ? '#dc2626' : col.isForeignKey ? '#16a34a' : '#cbd5e1',
                            }} />
                            <span style={{ fontWeight: col.isPrimaryKey ? 700 : 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {col.name}
                            </span>
                            <span style={{ color: '#94a3b8', fontSize: 9 }}>{col.type.split('(')[0]}</span>
                          </div>
                        ))}
                        {entity.columns.length > 8 && (
                          <div style={{ fontSize: 10, color: '#94a3b8', padding: '4px 6px', fontStyle: 'italic' }}>
                            +{entity.columns.length - 8} more columns
                          </div>
                        )}
                      </div>

                      {/* Metadata */}
                      <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #e2e8f0', fontSize: 10, color: '#94a3b8', display: 'flex', gap: 12 }}>
                        <div>{entity.columns.length} cols</div>
                        <div>{entity.columns.filter(c => c.isPrimaryKey).length} PK</div>
                        <div>{entity.columns.filter(c => c.isForeignKey).length} FK</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Details Panel */}
        <div style={{
          width: 320,
          borderLeft: '1px solid #e2e8f0',
          background: '#fff',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '100%',
          overflowY: 'auto',
        }}>
          <div style={{ padding: 16, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Settings size={16} color="#64748b" />
            <span style={{ fontWeight: 700, fontSize: 14 }}>Schema Details</span>
          </div>

          {selectedEntity ? (
            <div style={{ padding: 16, flex: 1, overflow: 'auto' }}>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Entity</div>
                <div style={{ fontSize: 13, color: '#475569', fontFamily: 'monospace', fontWeight: 500 }}>
                  {selectedEntity}
                </div>
              </div>

              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Relationships</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {relationships
                    .filter(r => r.from === selectedEntity || r.to === selectedEntity)
                    .map((rel, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: 8,
                          background: '#f1f5f9',
                          borderRadius: 4,
                          fontSize: 10,
                          fontFamily: 'monospace',
                        }}
                      >
                        <div style={{ color: '#475569', fontWeight: 500 }}>
                          {rel.from} → {rel.to}
                        </div>
                        <div style={{ color: '#94a3b8', marginTop: 4 }}>
                          {rel.fromColumn} ⟶ {rel.toColumn}
                        </div>
                        <div style={{ color: '#64748b', marginTop: 2, fontSize: 9 }}>
                          ({rel.type})
                        </div>
                      </div>
                    ))}
                  {relationships.filter(r => r.from === selectedEntity || r.to === selectedEntity).length === 0 && (
                    <div style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>No relationships</div>
                  )}
                </div>
              </div>

              <div style={{ fontSize: 12, color: '#94a3b8' }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>All Columns</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {entities
                    .find(e => e.name === selectedEntity)
                    ?.columns.map(col => (
                      <div
                        key={col.name}
                        style={{
                          padding: 6,
                          background: '#f8fafc',
                          borderRadius: 3,
                          fontSize: 9,
                          fontFamily: 'monospace',
                        }}
                      >
                        <div style={{ color: '#475569', fontWeight: 500 }}>
                          {col.name}
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: 8, marginTop: 2 }}>
                          {col.type}
                        </div>
                        <div style={{ color: '#64748b', fontSize: 8, marginTop: 1 }}>
                          {col.isPrimaryKey && '🔑 Primary Key '}
                          {col.isForeignKey && '🔗 Foreign Key '}
                          {col.nullable && '∅ Nullable'}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              padding: 16,
              color: '#94a3b8',
              fontSize: 13,
              textAlign: 'center',
              marginTop: '40%',
            }}>
              <Database size={32} color="#cbd5e1" style={{ marginBottom: 12, opacity: 0.5 }} />
              <div>Select an entity to view details</div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
