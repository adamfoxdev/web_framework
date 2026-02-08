import { useState } from 'react';
import { Plus, StopCircle, Trash2, RotateCw } from 'lucide-react';

interface Job {
  id: string;
  name: string;
  type: 'Pipeline' | 'Query' | 'Report' | 'Validation' | 'Import' | 'Export';
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: string;
  endTime?: string;
  duration?: number;
  progress: number;
  recordsProcessed: number;
  recordsFailed: number;
  output?: string;
  scheduledBy: string;
  errorMessage?: string;
}

const mockJobs: Job[] = [
  {
    id: '1',
    name: 'Daily Customer ETL',
    type: 'Pipeline',
    status: 'running',
    startTime: '2026-02-08 14:30',
    progress: 65,
    recordsProcessed: 6500,
    recordsFailed: 12,
    scheduledBy: 'System',
  },
  {
    id: '2',
    name: 'Generate Monthly Report',
    type: 'Report',
    status: 'completed',
    startTime: '2026-02-08 13:45',
    endTime: '2026-02-08 14:15',
    duration: 30,
    progress: 100,
    recordsProcessed: 98500,
    recordsFailed: 0,
    output: 'monthly_report_feb_2026.pdf',
    scheduledBy: 'admin@company.com',
  },
  {
    id: '3',
    name: 'Data Quality Validation',
    type: 'Validation',
    status: 'failed',
    startTime: '2026-02-08 12:00',
    endTime: '2026-02-08 12:15',
    duration: 15,
    progress: 45,
    recordsProcessed: 4500,
    recordsFailed: 230,
    scheduledBy: 'automation@system.local',
    errorMessage: 'Email format validation failed on 230 records',
  },
  {
    id: '4',
    name: 'Import Customer CSV',
    type: 'Import',
    status: 'completed',
    startTime: '2026-02-08 11:20',
    endTime: '2026-02-08 11:35',
    duration: 15,
    progress: 100,
    recordsProcessed: 5000,
    recordsFailed: 15,
    scheduledBy: 'john.doe@company.com',
  },
  {
    id: '5',
    name: 'Export Daily Summary',
    type: 'Export',
    status: 'queued',
    startTime: '2026-02-08 15:00',
    progress: 0,
    recordsProcessed: 0,
    recordsFailed: 0,
    scheduledBy: 'System',
  },
  {
    id: '6',
    name: 'Real-time Event Stream',
    type: 'Pipeline',
    status: 'running',
    startTime: '2026-02-08 14:15',
    progress: 82,
    recordsProcessed: 45230,
    recordsFailed: 8,
    scheduledBy: 'System',
  },
];

const typeColors: Record<Job['type'], string> = {
  Pipeline: '#2563eb',
  Query: '#7c3aed',
  Report: '#db2777',
  Validation: '#ea580c',
  Import: '#0891b2',
  Export: '#16a34a',
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>(mockJobs);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<Job['status'] | 'all'>('all');
  const [newJobName, setNewJobName] = useState('');
  const [newJobType, setNewJobType] = useState<Job['type']>('Pipeline');

  const handleCreateJob = () => {
    if (newJobName.trim()) {
      const newJob: Job = {
        id: String(jobs.length + 1),
        name: newJobName,
        type: newJobType,
        status: 'queued',
        startTime: new Date().toLocaleString(),
        progress: 0,
        recordsProcessed: 0,
        recordsFailed: 0,
        scheduledBy: 'current_user@company.com',
      };
      setJobs([newJob, ...jobs]);
      setNewJobName('');
      setShowCreateModal(false);
    }
  };

  const cancelJob = (id: string) => {
    setJobs(
      jobs.map((j) =>
        j.id === id && (j.status === 'queued' || j.status === 'running')
          ? { ...j, status: 'cancelled' }
          : j
      )
    );
  };

  const retryJob = (id: string) => {
    setJobs(
      jobs.map((j) =>
        j.id === id && j.status === 'failed'
          ? { ...j, status: 'queued', progress: 0, recordsProcessed: 0, recordsFailed: 0 }
          : j
      )
    );
  };

  const deleteJob = (id: string) => {
    setJobs(jobs.filter((j) => j.id !== id));
  };

  const filteredJobs = filterStatus === 'all' ? jobs : jobs.filter((j) => j.status === filterStatus);

  const getStatusColor = (status: Job['status']) => {
    switch (status) {
      case 'running':
        return '#2563eb';
      case 'completed':
        return '#16a34a';
      case 'failed':
        return '#dc2626';
      case 'cancelled':
        return '#64748b';
      case 'queued':
        return '#f59e0b';
      default:
        return '#64748b';
    }
  };

  const getStatusLabel = (status: Job['status']) => {
    switch (status) {
      case 'running':
        return '🔄 Running';
      case 'completed':
        return '✓ Completed';
      case 'failed':
        return '⚠ Failed';
      case 'cancelled':
        return '✕ Cancelled';
      case 'queued':
        return '⏳ Queued';
      default:
        return status;
    }
  };

  const stats = [
    {
      label: 'Total Jobs',
      value: jobs.length,
      color: '#2563eb',
    },
    {
      label: 'Running',
      value: jobs.filter((j) => j.status === 'running').length,
      color: '#2563eb',
    },
    {
      label: 'Completed',
      value: jobs.filter((j) => j.status === 'completed').length,
      color: '#16a34a',
    },
    {
      label: 'Failed',
      value: jobs.filter((j) => j.status === 'failed').length,
      color: '#dc2626',
    },
  ];

  const totalRecordsProcessed = jobs.reduce((sum, j) => sum + j.recordsProcessed, 0);
  const totalRecordsFailed = jobs.reduce((sum, j) => sum + j.recordsFailed, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 0 }}>Jobs</h1>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 0 }}>
              Monitor and manage scheduled jobs, imports, exports, and batch processes
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
            Schedule Job
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {stats.map((stat) => (
          <div key={stat.label} style={{ padding: 16, background: 'white', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <div style={{ color: '#64748b', fontSize: 13, fontWeight: 500, marginBottom: 12 }}>{stat.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
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
            <h2 style={{ marginBottom: 16 }}>Schedule New Job</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                  Job Name
                </label>
                <input
                  type="text"
                  value={newJobName}
                  onChange={(e) => setNewJobName(e.target.value)}
                  placeholder="e.g., Daily Data Sync"
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
                  Job Type
                </label>
                <select
                  value={newJobType}
                  onChange={(e) => setNewJobType(e.target.value as Job['type'])}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: 6,
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                >
                  <option>Pipeline</option>
                  <option>Query</option>
                  <option>Report</option>
                  <option>Validation</option>
                  <option>Import</option>
                  <option>Export</option>
                </select>
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
                onClick={handleCreateJob}
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
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
        {['all', 'running', 'completed', 'failed', 'queued', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status as any)}
            style={{
              padding: '8px 12px',
              background: filterStatus === status ? '#2563eb' : 'transparent',
              color: filterStatus === status ? 'white' : '#64748b',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: 13,
              transition: 'all 0.2s ease',
            }}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)} ({jobs.filter((j) => status === 'all' || j.status === status).length})
          </button>
        ))}
      </div>

      {/* Jobs List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filteredJobs.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
              background: '#f8fafc',
              borderRadius: 8,
              border: '1px dashed #cbd5e1',
            }}
          >
            <p style={{ color: '#64748b', marginBottom: 12 }}>
              No {filterStatus !== 'all' ? filterStatus : ''} jobs
            </p>
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
              Schedule First Job
            </button>
          </div>
        ) : (
          filteredJobs.map((job) => (
            <div
              key={job.id}
              style={{
                padding: 16,
                background: 'white',
                border:
                  job.status === 'failed'
                    ? '1px solid #fecaca'
                    : job.status === 'running'
                      ? '1px solid #bfdbfe'
                      : '1px solid #e2e8f0',
                borderRadius: 8,
                transition: 'all 0.2s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.boxShadow = '';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{job.name}</h3>
                    <span
                      style={{
                        padding: '4px 10px',
                        background: typeColors[job.type],
                        color: 'white',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {job.type}
                    </span>
                    <span
                      style={{
                        padding: '4px 10px',
                        background: getStatusColor(job.status),
                        color: 'white',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {getStatusLabel(job.status)}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  {(job.status === 'running' || job.status === 'queued') && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: '#64748b' }}>Progress</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#1e293b' }}>{job.progress}%</span>
                      </div>
                      <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            background: job.status === 'running' ? '#2563eb' : '#f59e0b',
                            width: `${job.progress}%`,
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Job Details Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, fontSize: 12 }}>
                    <div>
                      <div style={{ color: '#64748b', marginBottom: 2 }}>Start Time</div>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{job.startTime}</div>
                    </div>
                    {job.duration && (
                      <div>
                        <div style={{ color: '#64748b', marginBottom: 2 }}>Duration</div>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{job.duration} min</div>
                      </div>
                    )}
                    <div>
                      <div style={{ color: '#64748b', marginBottom: 2 }}>Processed</div>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{job.recordsProcessed.toLocaleString()} records</div>
                    </div>
                    {job.recordsFailed > 0 && (
                      <div>
                        <div style={{ color: '#64748b', marginBottom: 2 }}>Failed</div>
                        <div style={{ fontWeight: 600, color: '#dc2626' }}>{job.recordsFailed.toLocaleString()} records</div>
                      </div>
                    )}
                    <div>
                      <div style={{ color: '#64748b', marginBottom: 2 }}>Scheduled By</div>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{job.scheduledBy}</div>
                    </div>
                  </div>

                  {/* Error Message */}
                  {job.errorMessage && (
                    <div style={{ marginTop: 12, padding: 8, background: '#fee2e2', borderRadius: 4, border: '1px solid #fecaca' }}>
                      <div style={{ color: '#991b1b', fontSize: 12 }}>
                        <strong>Error:</strong> {job.errorMessage}
                      </div>
                    </div>
                  )}

                  {/* Output */}
                  {job.output && (
                    <div style={{ marginTop: 12, padding: 8, background: '#f0fdf4', borderRadius: 4, border: '1px solid #dcfce7' }}>
                      <div style={{ color: '#166534', fontSize: 12 }}>
                        <strong>Output:</strong> {job.output}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, marginLeft: 12 }}>
                  {(job.status === 'running' || job.status === 'queued') && (
                    <button
                      onClick={() => cancelJob(job.id)}
                      style={{
                        padding: '8px 12px',
                        background: '#fee2e2',
                        color: '#dc2626',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <StopCircle size={14} />
                      Cancel
                    </button>
                  )}
                  {job.status === 'failed' && (
                    <button
                      onClick={() => retryJob(job.id)}
                      style={{
                        padding: '8px 12px',
                        background: '#fef3c7',
                        color: '#b45309',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <RotateCw size={14} />
                      Retry
                    </button>
                  )}
                  {(job.status === 'completed' || job.status === 'cancelled') && (
                    <button
                      onClick={() => deleteJob(job.id)}
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
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary Stats */}
      {jobs.length > 0 && (
        <div style={{ padding: 20, background: '#f0f9ff', borderRadius: 8, border: '1px solid #bfdbfe' }}>
          <h3 style={{ margin: 0, marginBottom: 12, fontSize: 14, fontWeight: 700, color: '#1e40af' }}>
            Execution Summary
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, fontSize: 13 }}>
            <div>
              <span style={{ color: '#64748b' }}>Total Records Processed:</span>
              <div style={{ fontWeight: 700, color: '#1e293b', marginTop: 4 }}>
                {totalRecordsProcessed.toLocaleString()}
              </div>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Total Records Failed:</span>
              <div style={{ fontWeight: 700, color: '#dc2626', marginTop: 4 }}>
                {totalRecordsFailed.toLocaleString()}
              </div>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Success Rate:</span>
              <div style={{ fontWeight: 700, color: '#16a34a', marginTop: 4 }}>
                {totalRecordsProcessed === 0 ? 'N/A' : ((totalRecordsProcessed - totalRecordsFailed) / totalRecordsProcessed * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
