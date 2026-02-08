import { useState } from 'react';
import { Plus, Trash2, Edit2, Bell, Mail, MessageSquare, Webhook, ToggleLeft, ToggleRight, AlertTriangle, CheckCircle } from 'lucide-react';

interface AlertAction {
  type: 'email' | 'teams' | 'slack' | 'webhook' | 'sms';
  target: string;
  enabled: boolean;
}

interface AlertCondition {
  metric: string;
  operator: 'equals' | 'greater' | 'less' | 'contains' | 'matches';
  value: string;
}

interface Alert {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  condition: AlertCondition;
  actions: AlertAction[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  lastTriggeredAt?: string;
  triggerCount: number;
  nextCheckAt: string;
}

interface AlertEvent {
  id: string;
  alertId: string;
  alertName: string;
  triggeredAt: string;
  value: string;
  status: 'sent' | 'failed';
  message: string;
}

const mockAlerts: Alert[] = [
  {
    id: '1',
    name: 'High Job Failure Rate',
    description: 'Alert when job failure rate exceeds 10%',
    enabled: true,
    condition: {
      metric: 'job_failure_rate',
      operator: 'greater',
      value: '10',
    },
    actions: [
      { type: 'email', target: 'admin@company.com', enabled: true },
      { type: 'teams', target: 'https://outlook.webhook.office.com/webhookb2/...', enabled: true },
    ],
    severity: 'high',
    createdAt: '2026-01-15',
    lastTriggeredAt: '2026-02-08 10:30',
    triggerCount: 12,
    nextCheckAt: '2026-02-08 15:00',
  },
  {
    id: '2',
    name: 'Database Connection Timeout',
    description: 'Alert when database query takes longer than 30 seconds',
    enabled: true,
    condition: {
      metric: 'db_query_time',
      operator: 'greater',
      value: '30',
    },
    actions: [
      { type: 'slack', target: '#alerts', enabled: true },
      { type: 'webhook', target: 'https://api.example.com/alerts', enabled: false },
      { type: 'email', target: 'dba@company.com', enabled: true },
    ],
    severity: 'critical',
    createdAt: '2026-01-10',
    lastTriggeredAt: '2026-02-07 18:45',
    triggerCount: 3,
    nextCheckAt: '2026-02-08 16:00',
  },
  {
    id: '3',
    name: 'Low Disk Space',
    description: 'Alert when available disk space drops below 10GB',
    enabled: false,
    condition: {
      metric: 'disk_free',
      operator: 'less',
      value: '10',
    },
    actions: [
      { type: 'email', target: 'ops@company.com', enabled: true },
      { type: 'sms', target: '+1234567890', enabled: false },
    ],
    severity: 'medium',
    createdAt: '2026-01-20',
    nextCheckAt: '2026-02-09 00:00',
    triggerCount: 0,
  },
  {
    id: '4',
    name: 'Validation Rules Failures',
    description: 'Alert when data validation fails for critical fields',
    enabled: true,
    condition: {
      metric: 'validation_failures',
      operator: 'greater',
      value: '100',
    },
    actions: [
      { type: 'email', target: 'dataquality@company.com', enabled: true },
      { type: 'teams', target: 'https://outlook.webhook.office.com/webhookb2/...', enabled: true },
    ],
    severity: 'high',
    createdAt: '2026-01-25',
    lastTriggeredAt: '2026-02-08 09:15',
    triggerCount: 5,
    nextCheckAt: '2026-02-08 18:00',
  },
];

const mockAlertEvents: AlertEvent[] = [
  {
    id: '1',
    alertId: '1',
    alertName: 'High Job Failure Rate',
    triggeredAt: '2026-02-08 10:30',
    value: '12.5%',
    status: 'sent',
    message: 'Email sent to admin@company.com, Teams message posted',
  },
  {
    id: '2',
    alertId: '2',
    alertName: 'Database Connection Timeout',
    triggeredAt: '2026-02-07 18:45',
    value: '42 seconds',
    status: 'sent',
    message: 'Slack message sent to #alerts, Email sent to dba@company.com',
  },
  {
    id: '3',
    alertId: '1',
    alertName: 'High Job Failure Rate',
    triggeredAt: '2026-02-06 14:20',
    value: '11.2%',
    status: 'sent',
    message: 'Email sent to admin@company.com, Teams message posted',
  },
  {
    id: '4',
    alertId: '4',
    alertName: 'Validation Rules Failures',
    triggeredAt: '2026-02-08 09:15',
    value: '145 failures',
    status: 'failed',
    message: 'Failed to send Teams message - webhook timeout',
  },
];

const severityColors: Record<Alert['severity'], string> = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
  critical: '#7c2d12',
};

const severityBg: Record<Alert['severity'], string> = {
  low: '#d1fae5',
  medium: '#fef3c7',
  high: '#fee2e2',
  critical: '#fed7aa',
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [alertEvents] = useState<AlertEvent[]>(mockAlertEvents);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const [activeTab, setActiveTab] = useState<'alerts' | 'history'>('alerts');
  const [newAlertName, setNewAlertName] = useState('');
  const [newAlertDesc, setNewAlertDesc] = useState('');
  const [newAlertSeverity, setNewAlertSeverity] = useState<Alert['severity']>('medium');
  
  // Edit form state
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editSeverity, setEditSeverity] = useState<Alert['severity']>('medium');
  const [editMetric, setEditMetric] = useState('');
  const [editOperator, setEditOperator] = useState<AlertCondition['operator']>('greater');
  const [editValue, setEditValue] = useState('');
  const [editActions, setEditActions] = useState<AlertAction[]>([]);
  const [newActionType, setNewActionType] = useState<AlertAction['type']>('email');
  const [newActionTarget, setNewActionTarget] = useState('');

  // Edit action modal state
  const [showEditActionModal, setShowEditActionModal] = useState(false);
  const [editingActionIndex, setEditingActionIndex] = useState<number | null>(null);
  const [editingActionType, setEditingActionType] = useState<AlertAction['type']>('email');
  const [editingActionTarget, setEditingActionTarget] = useState('');

  const handleCreateAlert = () => {
    if (newAlertName.trim()) {
      const newAlert: Alert = {
        id: String(alerts.length + 1),
        name: newAlertName,
        description: newAlertDesc,
        enabled: true,
        condition: {
          metric: 'custom_metric',
          operator: 'greater',
          value: '0',
        },
        actions: [
          { type: 'email', target: 'admin@company.com', enabled: true },
        ],
        severity: newAlertSeverity,
        createdAt: new Date().toISOString().split('T')[0],
        triggerCount: 0,
        nextCheckAt: new Date(Date.now() + 3600000).toLocaleString(),
      };
      setAlerts([newAlert, ...alerts]);
      setNewAlertName('');
      setNewAlertDesc('');
      setShowCreateModal(false);
    }
  };

  const openEditModal = (alert: Alert) => {
    setEditingAlert(alert);
    setEditName(alert.name);
    setEditDesc(alert.description);
    setEditSeverity(alert.severity);
    setEditMetric(alert.condition.metric);
    setEditOperator(alert.condition.operator);
    setEditValue(alert.condition.value);
    setEditActions([...alert.actions]);
    setNewActionType('email');
    setNewActionTarget('');
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (editingAlert && editName.trim()) {
      const updatedAlert: Alert = {
        ...editingAlert,
        name: editName,
        description: editDesc,
        severity: editSeverity,
        condition: {
          metric: editMetric || 'custom_metric',
          operator: editOperator,
          value: editValue || '0',
        },
        actions: editActions,
      };
      setAlerts(alerts.map((a) => (a.id === editingAlert.id ? updatedAlert : a)));
      setShowEditModal(false);
      setEditingAlert(null);
    }
  };

  const addAction = () => {
    if (newActionTarget.trim()) {
      setEditActions([
        ...editActions,
        { type: newActionType, target: newActionTarget, enabled: true },
      ]);
      setNewActionTarget('');
    }
  };

  const removeAction = (index: number) => {
    setEditActions(editActions.filter((_, i) => i !== index));
  };

  const toggleActionEnabled = (index: number) => {
    const updated = [...editActions];
    updated[index].enabled = !updated[index].enabled;
    setEditActions(updated);
  };

  const openEditActionModal = (index: number) => {
    const action = editActions[index];
    setEditingActionIndex(index);
    setEditingActionType(action.type);
    setEditingActionTarget(action.target);
    setShowEditActionModal(true);
  };

  const handleSaveActionEdit = () => {
    if (editingActionIndex !== null && editingActionTarget.trim()) {
      const updated = [...editActions];
      updated[editingActionIndex] = {
        type: editingActionType,
        target: editingActionTarget,
        enabled: updated[editingActionIndex].enabled,
      };
      setEditActions(updated);
      setShowEditActionModal(false);
      setEditingActionIndex(null);
    }
  };

  const toggleAlert = (id: string) => {
    setAlerts(
      alerts.map((a) =>
        a.id === id ? { ...a, enabled: !a.enabled } : a
      )
    );
  };

  const deleteAlert = (id: string) => {
    setAlerts(alerts.filter((a) => a.id !== id));
  };

  const stats = [
    { label: 'Total Alerts', value: alerts.length, color: '#2563eb' },
    { label: 'Active', value: alerts.filter((a) => a.enabled).length, color: '#16a34a' },
    { label: 'Critical', value: alerts.filter((a) => a.severity === 'critical' && a.enabled).length, color: '#dc2626' },
    { label: 'Triggered Today', value: alertEvents.filter((e) => e.triggeredAt.includes('2026-02-08')).length, color: '#f59e0b' },
  ];

  const getActionIcon = (type: AlertAction['type']) => {
    switch (type) {
      case 'email':
        return <Mail size={14} />;
      case 'teams':
        return <MessageSquare size={14} />;
      case 'slack':
        return <MessageSquare size={14} />;
      case 'webhook':
        return <Webhook size={14} />;
      case 'sms':
        return 'SMS';
      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 0 }}>Alerts & Notifications</h1>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 0 }}>
              Configure alerts for system events, send notifications via email, Teams, Slack, webhooks, and SMS
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
            New Alert
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
            <h2 style={{ marginBottom: 16 }}>Create New Alert</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                  Alert Name
                </label>
                <input
                  type="text"
                  value={newAlertName}
                  onChange={(e) => setNewAlertName(e.target.value)}
                  placeholder="e.g., High Error Rate"
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
                  value={newAlertDesc}
                  onChange={(e) => setNewAlertDesc(e.target.value)}
                  placeholder="Describe when this alert should trigger..."
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
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                  Severity
                </label>
                <select
                  value={newAlertSeverity}
                  onChange={(e) => setNewAlertSeverity(e.target.value as Alert['severity'])}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: 6,
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
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
                onClick={handleCreateAlert}
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

      {/* Edit Modal */}
      {showEditModal && editingAlert && (
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
          onClick={() => setShowEditModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 8,
              padding: 24,
              maxWidth: 600,
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: 20 }}>Edit Alert</h2>
            
            {/* Basic Info */}
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#1e293b' }}>Basic Information</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Alert Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
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
                  <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Description</label>
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
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
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Severity</label>
                  <select
                    value={editSeverity}
                    onChange={(e) => setEditSeverity(e.target.value as Alert['severity'])}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: 6,
                      fontSize: 14,
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Condition */}
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#1e293b' }}>Trigger Condition</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Metric</label>
                  <input
                    type="text"
                    value={editMetric}
                    onChange={(e) => setEditMetric(e.target.value)}
                    placeholder="e.g., job_failure_rate, db_query_time"
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Operator</label>
                    <select
                      value={editOperator}
                      onChange={(e) => setEditOperator(e.target.value as AlertCondition['operator'])}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #cbd5e1',
                        borderRadius: 6,
                        fontSize: 14,
                        boxSizing: 'border-box',
                      }}
                    >
                      <option value="equals">Equals</option>
                      <option value="greater">Greater Than</option>
                      <option value="less">Less Than</option>
                      <option value="contains">Contains</option>
                      <option value="matches">Matches Pattern</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Value</label>
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      placeholder="e.g., 10, 30"
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
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#1e293b' }}>Alert Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {editActions.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {editActions.map((action, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: 12,
                          background: '#f8fafc',
                          border: '1px solid #cbd5e1',
                          borderRadius: 6,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <button
                          onClick={() => toggleActionEnabled(idx)}
                          style={{
                            padding: 0,
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: action.enabled ? '#16a34a' : '#cbd5e1',
                          }}
                        >
                          {action.enabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                        </button>
                        <div 
                          onClick={() => openEditActionModal(idx)}
                          style={{ flex: 1, fontSize: 13, cursor: 'pointer' }}
                        >
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>{action.type}</div>
                          <div style={{ color: '#64748b', fontSize: 12 }}>{action.target}</div>
                        </div>
                        <button
                          onClick={() => removeAction(idx)}
                          style={{
                            padding: '4px 8px',
                            background: '#fee2e2',
                            color: '#dc2626',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <select
                    value={newActionType}
                    onChange={(e) => setNewActionType(e.target.value as AlertAction['type'])}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: 6,
                      fontSize: 13,
                      flex: 0.3,
                    }}
                  >
                    <option value="email">Email</option>
                    <option value="teams">Teams</option>
                    <option value="slack">Slack</option>
                    <option value="webhook">Webhook</option>
                    <option value="sms">SMS</option>
                  </select>
                  <input
                    type="text"
                    value={newActionTarget}
                    onChange={(e) => setNewActionTarget(e.target.value)}
                    placeholder={
                      newActionType === 'email' ? 'email@company.com' :
                      newActionType === 'webhook' ? 'https://api.example.com/alerts' :
                      newActionType === 'sms' ? '+1234567890' : '#channel or URL'
                    }
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: 6,
                      fontSize: 13,
                    }}
                  />
                  <button
                    onClick={addAction}
                    style={{
                      padding: '8px 12px',
                      background: '#ecfdf5',
                      color: '#059669',
                      border: '1px solid #86efac',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowEditModal(false)}
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
                onClick={handleSaveEdit}
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
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Action Modal */}
      {showEditActionModal && editingActionIndex !== null && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001,
          }}
          onClick={() => setShowEditActionModal(false)}
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
            <h2 style={{ marginBottom: 20 }}>Edit Action</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                  Action Type
                </label>
                <select
                  value={editingActionType}
                  onChange={(e) => setEditingActionType(e.target.value as AlertAction['type'])}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: 6,
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="email">Email</option>
                  <option value="teams">Teams</option>
                  <option value="slack">Slack</option>
                  <option value="webhook">Webhook</option>
                  <option value="sms">SMS</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                  Target
                </label>
                <input
                  type="text"
                  value={editingActionTarget}
                  onChange={(e) => setEditingActionTarget(e.target.value)}
                  placeholder="e.g., user@example.com or webhook URL"
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
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowEditActionModal(false)}
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
                onClick={handleSaveActionEdit}
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
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
        {(['alerts', 'history'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 12px',
              background: activeTab === tab ? '#2563eb' : 'transparent',
              color: activeTab === tab ? 'white' : '#64748b',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: 13,
              transition: 'all 0.2s ease',
            }}
          >
            {tab === 'alerts' ? `📋 Active Alerts (${alerts.length})` : `⏰ Trigger History (${alertEvents.length})`}
          </button>
        ))}
      </div>

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {alerts.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', background: '#f8fafc', borderRadius: 8, border: '1px dashed #cbd5e1' }}>
              <p style={{ color: '#64748b', marginBottom: 12 }}>No alerts configured yet</p>
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
                Create First Alert
              </button>
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                style={{
                  padding: 16,
                  background: 'white',
                  border: `1px solid ${alert.enabled ? '#e2e8f0' : '#f1f5f9'}`,
                  borderRadius: 8,
                  transition: 'all 0.2s ease',
                  opacity: alert.enabled ? 1 : 0.7,
                }}
                onMouseOver={(e) => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; }}
                onMouseOut={(e) => { e.currentTarget.style.boxShadow = ''; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{alert.name}</h3>
                      <span
                        style={{
                          padding: '4px 10px',
                          background: severityBg[alert.severity],
                          color: severityColors[alert.severity],
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {alert.severity.toUpperCase()}
                      </span>
                    </div>
                    <p style={{ margin: 0, color: '#64748b', fontSize: 13, marginBottom: 12 }}>{alert.description}</p>

                    <div style={{ marginBottom: 12, padding: 12, background: '#f8fafc', borderRadius: 6 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#1e293b' }}>Condition</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>
                        {alert.condition.metric} {alert.condition.operator} {alert.condition.value}
                      </div>
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: '#1e293b' }}>
                        Actions ({alert.actions.length})
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {alert.actions.map((action, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: '6px 10px',
                              background: action.enabled ? '#e0f2fe' : '#f1f5f9',
                              border: `1px solid ${action.enabled ? '#bae6fd' : '#cbd5e1'}`,
                              borderRadius: 4,
                              fontSize: 11,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              color: action.enabled ? '#0369a1' : '#64748b',
                              opacity: action.enabled ? 1 : 0.6,
                            }}
                          >
                            {getActionIcon(action.type)}
                            <span>{action.type}</span>
                            {!action.enabled && <span style={{ marginLeft: 4 }}>(disabled)</span>}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, fontSize: 12 }}>
                      <div>
                        <div style={{ color: '#64748b', marginBottom: 2 }}>Created</div>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{alert.createdAt}</div>
                      </div>
                      {alert.lastTriggeredAt && (
                        <div>
                          <div style={{ color: '#64748b', marginBottom: 2 }}>Last Triggered</div>
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>{alert.lastTriggeredAt}</div>
                        </div>
                      )}
                      <div>
                        <div style={{ color: '#64748b', marginBottom: 2 }}>Trigger Count</div>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{alert.triggerCount}x</div>
                      </div>
                      <div>
                        <div style={{ color: '#64748b', marginBottom: 2 }}>Next Check</div>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{alert.nextCheckAt}</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6, marginLeft: 12, flexDirection: 'column' }}>
                    <button
                      onClick={() => toggleAlert(alert.id)}
                      style={{
                        padding: '8px 12px',
                        background: alert.enabled ? '#fee2e2' : '#d1fae5',
                        color: alert.enabled ? '#dc2626' : '#059669',
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
                      {alert.enabled ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                      {alert.enabled ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => openEditModal(alert)}
                      style={{
                        padding: '8px 12px',
                        background: '#f0f4f8',
                        color: '#2563eb',
                        border: '1px solid #cbd5e1',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Edit2 size={14} />
                      Edit
                    </button>
                    <button
                      onClick={() => deleteAlert(alert.id)}
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
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {alertEvents.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', background: '#f8fafc', borderRadius: 8, border: '1px dashed #cbd5e1' }}>
              <p style={{ color: '#64748b', marginBottom: 12 }}>No alert triggers yet</p>
            </div>
          ) : (
            alertEvents.map((event) => (
              <div
                key={event.id}
                style={{
                  padding: 16,
                  background: 'white',
                  border: event.status === 'failed' ? '1px solid #fecaca' : '1px solid #e2e8f0',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <div style={{ marginTop: 2 }}>
                  {event.status === 'sent' ? (
                    <CheckCircle size={20} color="#16a34a" />
                  ) : (
                    <AlertTriangle size={20} color="#dc2626" />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{event.alertName}</h4>
                    <span
                      style={{
                        padding: '2px 8px',
                        background: event.status === 'sent' ? '#d1fae5' : '#fee2e2',
                        color: event.status === 'sent' ? '#065f46' : '#991b1b',
                        borderRadius: 3,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {event.status === 'sent' ? '✓ Sent' : '✕ Failed'}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 8, fontSize: 12 }}>
                    <div>
                      <span style={{ color: '#64748b' }}>Triggered At:</span>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{event.triggeredAt}</div>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Value:</span>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{event.value}</div>
                    </div>
                  </div>
                  <div style={{ padding: 10, background: '#f1f5f9', borderRadius: 4, fontSize: 12, color: '#64748b' }}>
                    {event.message}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Notification Methods Info */}
      <div style={{ padding: 20, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: 0, marginBottom: 12, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>
          Available Notification Methods
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, fontSize: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontWeight: 600, color: '#1e293b' }}>
              <Mail size={16} /> Email
            </div>
            <div style={{ color: '#64748b' }}>Send email notifications to configured recipients</div>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontWeight: 600, color: '#1e293b' }}>
              <MessageSquare size={16} /> Teams / Slack
            </div>
            <div style={{ color: '#64748b' }}>Post messages to Teams channels or Slack threads</div>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontWeight: 600, color: '#1e293b' }}>
              <Webhook size={16} /> Webhooks
            </div>
            <div style={{ color: '#64748b' }}>Send HTTP POST requests to custom endpoints</div>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontWeight: 600, color: '#1e293b' }}>
              <Bell size={16} /> SMS
            </div>
            <div style={{ color: '#64748b' }}>Send SMS text messages to configured phone numbers</div>
          </div>
        </div>
      </div>
    </div>
  );
}
