import { useState } from 'react';
import { Plus, Play, Pause, Trash2, MoreVertical, TrendingUp, Activity, Zap, AlertCircle } from 'lucide-react';

interface Pipeline {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'error' | 'running';
  lastRun: string;
  nextRun: string;
  succeededRuns: number;
  failedRuns: number;
  averageDuration: number;
  dataSourceCount: number;
}

const mockPipelines: Pipeline[] = [
  {
    id: '1',
    name: 'Daily Customer ETL',
    description: 'Extract customer data from CRM, transform, and load to warehouse',
    status: 'active',
    lastRun: '2026-02-08 14:30',
    nextRun: '2026-02-09 00:00',
    succeededRuns: 145,
    failedRuns: 2,
    averageDuration: 45,
    dataSourceCount: 3,
  },
  {
    id: '2',
    name: 'Real-time Event Stream',
    description: 'Stream user events from applications into analytics platform',
    status: 'running',
    lastRun: '2026-02-08 14:15',
    nextRun: '2026-02-08 14:45',
    succeededRuns: 892,
    failedRuns: 5,
    averageDuration: 15,
    dataSourceCount: 5,
  },
  {
    id: '3',
    name: 'Weekly Sales Report',
    description: 'Generate weekly sales aggregations and push to reporting database',
    status: 'paused',
    lastRun: '2026-02-07 18:00',
    nextRun: '2026-02-15 18:00',
    succeededRuns: 52,
    failedRuns: 0,
    averageDuration: 120,
    dataSourceCount: 2,
  },
  {
    id: '4',
    name: 'Data Quality Checks',
    description: 'Run validation rules and quality checks on all datasets',
    status: 'error',
    lastRun: '2026-02-08 12:00',
    nextRun: '2026-02-08 15:00',
    succeededRuns: 67,
    failedRuns: 3,
    averageDuration: 30,
    dataSourceCount: 7,
  },
];

export default function DataPipelinesPage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>(mockPipelines);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPipelineName, setNewPipelineName] = useState('');
  const [newPipelineDesc, setNewPipelineDesc] = useState('');

  const handleCreatePipeline = () => {
    if (newPipelineName.trim()) {
      const newPipeline: Pipeline = {
        id: String(pipelines.length + 1),
        name: newPipelineName,
        description: newPipelineDesc,
        status: 'paused',
        lastRun: 'Never',
        nextRun: 'Not scheduled',
        succeededRuns: 0,
        failedRuns: 0,
        averageDuration: 0,
        dataSourceCount: 0,
      };
      setPipelines([...pipelines, newPipeline]);
      setNewPipelineName('');
      setNewPipelineDesc('');
      setShowCreateModal(false);
    }
  };

  const togglePipeline = (id: string) => {
    setPipelines(
      pipelines.map((p) =>
        p.id === id
          ? { ...p, status: p.status === 'active' ? 'paused' : 'active' }
          : p
      )
    );
  };

  const deletePipeline = (id: string) => {
    setPipelines(pipelines.filter((p) => p.id !== id));
  };

  const getStatusColor = (status: Pipeline['status']) => {
    switch (status) {
      case 'active':
        return '#16a34a';
      case 'running':
        return '#2563eb';
      case 'paused':
        return '#94a3b8';
      case 'error':
        return '#dc2626';
      default:
        return '#64748b';
    }
  };

  const getStatusLabel = (status: Pipeline['status']) => {
    switch (status) {
      case 'running':
        return '🔄 Running';
      case 'active':
        return '✓ Active';
      case 'paused':
        return '⏸ Paused';
      case 'error':
        return '⚠ Error';
      default:
        return status;
    }
  };

  const stats = [
    {
      label: 'Total Pipelines',
      value: pipelines.length,
      icon: Activity,
      color: '#2563eb',
    },
    {
      label: 'Active',
      value: pipelines.filter((p) => p.status === 'active' || p.status === 'running').length,
      icon: TrendingUp,
      color: '#16a34a',
    },
    {
      label: 'Errors',
      value: pipelines.filter((p) => p.status === 'error').length,
      icon: AlertCircle,
      color: '#dc2626',
    },
    {
      label: 'Total Runs',
      value: pipelines.reduce((sum, p) => sum + p.succeededRuns + p.failedRuns, 0),
      icon: Zap,
      color: '#f59e0b',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 0 }}>Data Pipelines</h1>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 0 }}>
              Manage and monitor ETL pipelines, data streams, and automated workflows
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '10px 16px',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Plus size={18} />
            New Pipeline
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {stats.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <div key={stat.label} style={{ padding: 16, background: 'white', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>{stat.label}</span>
                <IconComponent size={20} color={stat.color} />
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: stat.color }}>{stat.value}</div>
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 8,
              padding: 24,
              maxWidth: 500,
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: 16 }}>Create New Pipeline</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                  Pipeline Name
                </label>
                <input
                  type="text"
                  value={newPipelineName}
                  onChange={(e) => setNewPipelineName(e.target.value)}
                  placeholder="e.g., Daily Customer ETL"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: 6,
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                  Description
                </label>
                <textarea
                  value={newPipelineDesc}
                  onChange={(e) => setNewPipelineDesc(e.target.value)}
                  placeholder="Describe this pipeline..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: 6,
                    fontSize: 14,
                    minHeight: 80,
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  padding: '8px 16px',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePipeline}
                style={{
                  padding: '8px 16px',
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pipelines List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>All Pipelines ({pipelines.length})</h2>
        {pipelines.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
              background: '#f8fafc',
              borderRadius: 8,
              border: '1px dashed #cbd5e1',
            }}
          >
            <p style={{ color: '#64748b', marginBottom: 12 }}>No pipelines created yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                padding: '8px 16px',
                background: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Create First Pipeline
            </button>
          </div>
        ) : (
          pipelines.map((pipeline) => (
            <div
              key={pipeline.id}
              style={{
                padding: 16,
                background: 'white',
                border: `1px solid ${
                  pipeline.status === 'error' ? '#fecaca' : pipeline.status === 'running' ? '#bfdbfe' : '#e2e8f0'
                }`,
                borderRadius: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                transition: 'all 0.2s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.boxShadow = '';
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{pipeline.name}</h3>
                  <span
                    style={{
                      padding: '4px 10px',
                      background: getStatusColor(pipeline.status),
                      color: 'white',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {getStatusLabel(pipeline.status)}
                  </span>
                </div>
                <p style={{ margin: 0, color: '#64748b', fontSize: 13, marginBottom: 12 }}>
                  {pipeline.description}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, fontSize: 12 }}>
                  <div>
                    <div style={{ color: '#64748b', marginBottom: 2 }}>Last Run</div>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{pipeline.lastRun}</div>
                  </div>
                  <div>
                    <div style={{ color: '#64748b', marginBottom: 2 }}>Next Run</div>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{pipeline.nextRun}</div>
                  </div>
                  <div>
                    <div style={{ color: '#64748b', marginBottom: 2 }}>Success Rate</div>
                    <div style={{ fontWeight: 600, color: '#16a34a' }}>
                      {pipeline.succeededRuns + pipeline.failedRuns === 0
                        ? 'N/A'
                        : (
                            (pipeline.succeededRuns / (pipeline.succeededRuns + pipeline.failedRuns)) *
                            100
                          ).toFixed(1) + '%'}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#64748b', marginBottom: 2 }}>Avg Duration</div>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{pipeline.averageDuration}min</div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginLeft: 16 }}>
                <button
                  onClick={() => togglePipeline(pipeline.id)}
                  style={{
                    padding: '8px 12px',
                    background: pipeline.status === 'active' || pipeline.status === 'running' ? '#fee2e2' : '#d1fae5',
                    color:
                      pipeline.status === 'active' || pipeline.status === 'running'
                        ? '#dc2626'
                        : '#059669',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.opacity = '0.8';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  {pipeline.status === 'active' || pipeline.status === 'running' ? (
                    <>
                      <Pause size={14} />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play size={14} />
                      Start
                    </>
                  )}
                </button>
                <button
                  onClick={() => deletePipeline(pipeline.id)}
                  style={{
                    padding: '8px 12px',
                    background: '#fef2f2',
                    color: '#dc2626',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.opacity = '0.8';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  <Trash2 size={14} />
                </button>
                <button
                  style={{
                    padding: '8px 12px',
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: 6,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#e2e8f0';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#f1f5f9';
                  }}
                >
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Stats */}
      {pipelines.length > 0 && (
        <div style={{ padding: 20, background: '#f0f9ff', borderRadius: 8, border: '1px solid #bfdbfe' }}>
          <h3 style={{ margin: 0, marginBottom: 12, fontSize: 14, fontWeight: 700, color: '#1e40af' }}>
            Pipeline Insights
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, fontSize: 13 }}>
            <div>
              <span style={{ color: '#64748b' }}>Total Data Sources:</span>
              <div style={{ fontWeight: 700, color: '#1e293b', marginTop: 4 }}>
                {pipelines.reduce((sum, p) => sum + p.dataSourceCount, 0)}
              </div>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Total Successful Runs:</span>
              <div style={{ fontWeight: 700, color: '#16a34a', marginTop: 4 }}>
                {pipelines.reduce((sum, p) => sum + p.succeededRuns, 0)}
              </div>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Total Failed Runs:</span>
              <div style={{ fontWeight: 700, color: '#dc2626', marginTop: 4 }}>
                {pipelines.reduce((sum, p) => sum + p.failedRuns, 0)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
