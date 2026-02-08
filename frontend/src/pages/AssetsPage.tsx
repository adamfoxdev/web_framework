import { useState } from 'react';
import { Plus, Trash2, Edit2, Search, Server, Zap, Link2, Phone } from 'lucide-react';

interface Server {
  id: string;
  name: string;
  ipAddress: string;
  status: 'online' | 'offline' | 'maintenance';
  type: 'web' | 'database' | 'cache' | 'queue' | 'storage';
  location: string;
  osType: string;
  cpuCores: number;
  memoryGB: number;
  diskGB: number;
  lastChecked: string;
  notes: string;
}

interface Process {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'error';
  hostServer: string;
  port?: number;
  cpuUsage: number;
  memoryUsage: number;
  uptime: string;
  version: string;
  notes: string;
}

interface Integration {
  id: string;
  name: string;
  type: 'api' | 'webhook' | 'database' | 'service' | 'custom';
  status: 'active' | 'inactive' | 'error';
  provider: string;
  lastSync: string;
  syncFrequency: string;
  dataFlow: 'inbound' | 'outbound' | 'bidirectional';
  notes: string;
}

interface HelpDeskContact {
  id: string;
  name: string;
  role: string;
  department: string;
  phone: string;
  email: string;
  availability: 'available' | 'unavailable' | 'on-break';
  specialization: string;
  notes: string;
}

const mockServers: Server[] = [
  {
    id: '1',
    name: 'WEB-01',
    ipAddress: '192.168.1.10',
    status: 'online',
    type: 'web',
    location: 'US-East-1',
    osType: 'Ubuntu 22.04 LTS',
    cpuCores: 8,
    memoryGB: 32,
    diskGB: 500,
    lastChecked: '2026-02-08 14:32:00',
    notes: 'Primary web server',
  },
  {
    id: '2',
    name: 'DB-01',
    ipAddress: '192.168.1.20',
    status: 'online',
    type: 'database',
    location: 'US-East-1',
    osType: 'Ubuntu 22.04 LTS',
    cpuCores: 16,
    memoryGB: 64,
    diskGB: 2000,
    lastChecked: '2026-02-08 14:35:00',
    notes: 'Primary PostgreSQL database',
  },
  {
    id: '3',
    name: 'CACHE-01',
    ipAddress: '192.168.1.30',
    status: 'online',
    type: 'cache',
    location: 'US-East-1',
    osType: 'CentOS 8',
    cpuCores: 4,
    memoryGB: 16,
    diskGB: 100,
    lastChecked: '2026-02-08 14:33:00',
    notes: 'Redis cache cluster',
  },
];

const mockProcesses: Process[] = [
  {
    id: '1',
    name: 'API Service',
    status: 'running',
    hostServer: 'WEB-01',
    port: 8080,
    cpuUsage: 12.5,
    memoryUsage: 2048,
    uptime: '45 days 3 hours',
    version: '3.2.1',
    notes: 'Main API server',
  },
  {
    id: '2',
    name: 'Background Jobs',
    status: 'running',
    hostServer: 'WEB-01',
    port: 8081,
    cpuUsage: 5.2,
    memoryUsage: 1024,
    uptime: '45 days 3 hours',
    version: '3.2.1',
    notes: 'Task queue processor',
  },
  {
    id: '3',
    name: 'PostgreSQL',
    status: 'running',
    hostServer: 'DB-01',
    port: 5432,
    cpuUsage: 8.7,
    memoryUsage: 12288,
    uptime: '90 days 2 hours',
    version: '14.5',
    notes: 'Primary database',
  },
];

const mockIntegrations: Integration[] = [
  {
    id: '1',
    name: 'Slack Notifications',
    type: 'webhook',
    status: 'active',
    provider: 'Slack',
    lastSync: '2026-02-08 15:45:00',
    syncFrequency: 'real-time',
    dataFlow: 'outbound',
    notes: 'Sends alert notifications to Slack',
  },
  {
    id: '2',
    name: 'GitHub Integration',
    type: 'api',
    status: 'active',
    provider: 'GitHub',
    lastSync: '2026-02-08 15:30:00',
    syncFrequency: 'hourly',
    dataFlow: 'inbound',
    notes: 'Syncs repository metadata',
  },
  {
    id: '3',
    name: 'Azure SQL Analytics',
    type: 'database',
    status: 'active',
    provider: 'Microsoft Azure',
    lastSync: '2026-02-08 14:00:00',
    syncFrequency: 'daily',
    dataFlow: 'bidirectional',
    notes: 'Data warehouse sync',
  },
];

const mockContacts: HelpDeskContact[] = [
  {
    id: '1',
    name: 'John Smith',
    role: 'Senior System Administrator',
    department: 'Infrastructure',
    phone: '+1-555-0101',
    email: 'john.smith@company.com',
    availability: 'available',
    specialization: 'Server Management, Linux',
    notes: 'On-call for critical incidents',
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    role: 'Database Administrator',
    department: 'Database Team',
    phone: '+1-555-0102',
    email: 'sarah.johnson@company.com',
    availability: 'available',
    specialization: 'PostgreSQL, Backup & Recovery',
    notes: 'Expert in performance tuning',
  },
  {
    id: '3',
    name: 'Mike Davis',
    role: 'Integration Specialist',
    department: 'Integration',
    phone: '+1-555-0103',
    email: 'mike.davis@company.com',
    availability: 'on-break',
    specialization: 'API Integration, Webhooks',
    notes: 'Available after 3 PM',
  },
];

export default function AssetsPage() {
  const [activeTab, setActiveTab] = useState<'servers' | 'processes' | 'integrations' | 'contacts'>('servers');
  const [searchQuery, setSearchQuery] = useState('');

  // Servers state
  const [servers, setServers] = useState<Server[]>(mockServers);
  const [showServerModal, setShowServerModal] = useState(false);
  const [editingServer, setEditingServer] = useState<Server | null>(null);
  const [serverFormData, setServerFormData] = useState<Partial<Server>>({});

  // Processes state
  const [processes, setProcesses] = useState<Process[]>(mockProcesses);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [editingProcess, setEditingProcess] = useState<Process | null>(null);
  const [processFormData, setProcessFormData] = useState<Partial<Process>>({});

  // Integrations state
  const [integrations, setIntegrations] = useState<Integration[]>(mockIntegrations);
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<Integration | null>(null);
  const [integrationFormData, setIntegrationFormData] = useState<Partial<Integration>>({});

  // Contacts state
  const [contacts, setContacts] = useState<HelpDeskContact[]>(mockContacts);
  const [showContactModal, setShowContactModal] = useState(false);
  const [editingContact, setEditingContact] = useState<HelpDeskContact | null>(null);
  const [contactFormData, setContactFormData] = useState<Partial<HelpDeskContact>>({});

  // Server handlers
  const handleAddServer = () => {
    if (serverFormData.name && serverFormData.ipAddress) {
      const newServer: Server = {
        id: String(servers.length + 1),
        name: serverFormData.name,
        ipAddress: serverFormData.ipAddress,
        status: serverFormData.status || 'offline',
        type: serverFormData.type || 'web',
        location: serverFormData.location || 'US-East-1',
        osType: serverFormData.osType || 'Ubuntu',
        cpuCores: serverFormData.cpuCores || 4,
        memoryGB: serverFormData.memoryGB || 8,
        diskGB: serverFormData.diskGB || 100,
        lastChecked: new Date().toLocaleString(),
        notes: serverFormData.notes || '',
      };
      setServers([newServer, ...servers]);
      setShowServerModal(false);
      setServerFormData({});
    }
  };

  const handleEditServer = (server: Server) => {
    setEditingServer(server);
    setServerFormData(server);
    setShowServerModal(true);
  };

  const handleSaveServer = () => {
    if (editingServer && serverFormData.name && serverFormData.ipAddress) {
      setServers(
        servers.map((s) =>
          s.id === editingServer.id
            ? {
                ...s,
                name: serverFormData.name || s.name,
                ipAddress: serverFormData.ipAddress || s.ipAddress,
                status: serverFormData.status || s.status,
                type: serverFormData.type || s.type,
                location: serverFormData.location || s.location,
                osType: serverFormData.osType || s.osType,
                cpuCores: serverFormData.cpuCores || s.cpuCores,
                memoryGB: serverFormData.memoryGB || s.memoryGB,
                diskGB: serverFormData.diskGB || s.diskGB,
                notes: serverFormData.notes || s.notes,
              }
            : s
        )
      );
      setShowServerModal(false);
      setEditingServer(null);
      setServerFormData({});
    }
  };

  const deleteServer = (id: string) => {
    setServers(servers.filter((s) => s.id !== id));
  };

  // Process handlers
  const handleAddProcess = () => {
    if (processFormData.name && processFormData.hostServer) {
      const newProcess: Process = {
        id: String(processes.length + 1),
        name: processFormData.name,
        status: processFormData.status || 'stopped',
        hostServer: processFormData.hostServer,
        port: processFormData.port,
        cpuUsage: processFormData.cpuUsage || 0,
        memoryUsage: processFormData.memoryUsage || 0,
        uptime: processFormData.uptime || '0 hours',
        version: processFormData.version || '1.0.0',
        notes: processFormData.notes || '',
      };
      setProcesses([newProcess, ...processes]);
      setShowProcessModal(false);
      setProcessFormData({});
    }
  };

  const handleEditProcess = (process: Process) => {
    setEditingProcess(process);
    setProcessFormData(process);
    setShowProcessModal(true);
  };

  const handleSaveProcess = () => {
    if (editingProcess && processFormData.name && processFormData.hostServer) {
      setProcesses(
        processes.map((p) =>
          p.id === editingProcess.id
            ? {
                ...p,
                name: processFormData.name || p.name,
                status: processFormData.status || p.status,
                hostServer: processFormData.hostServer || p.hostServer,
                port: processFormData.port || p.port,
                cpuUsage: processFormData.cpuUsage || p.cpuUsage,
                memoryUsage: processFormData.memoryUsage || p.memoryUsage,
                uptime: processFormData.uptime || p.uptime,
                version: processFormData.version || p.version,
                notes: processFormData.notes || p.notes,
              }
            : p
        )
      );
      setShowProcessModal(false);
      setEditingProcess(null);
      setProcessFormData({});
    }
  };

  const deleteProcess = (id: string) => {
    setProcesses(processes.filter((p) => p.id !== id));
  };

  // Integration handlers
  const handleAddIntegration = () => {
    if (integrationFormData.name && integrationFormData.provider) {
      const newIntegration: Integration = {
        id: String(integrations.length + 1),
        name: integrationFormData.name,
        type: integrationFormData.type || 'api',
        status: integrationFormData.status || 'inactive',
        provider: integrationFormData.provider,
        lastSync: new Date().toLocaleString(),
        syncFrequency: integrationFormData.syncFrequency || 'hourly',
        dataFlow: integrationFormData.dataFlow || 'inbound',
        notes: integrationFormData.notes || '',
      };
      setIntegrations([newIntegration, ...integrations]);
      setShowIntegrationModal(false);
      setIntegrationFormData({});
    }
  };

  const handleEditIntegration = (integration: Integration) => {
    setEditingIntegration(integration);
    setIntegrationFormData(integration);
    setShowIntegrationModal(true);
  };

  const handleSaveIntegration = () => {
    if (editingIntegration && integrationFormData.name && integrationFormData.provider) {
      setIntegrations(
        integrations.map((i) =>
          i.id === editingIntegration.id
            ? {
                ...i,
                name: integrationFormData.name || i.name,
                type: integrationFormData.type || i.type,
                status: integrationFormData.status || i.status,
                provider: integrationFormData.provider || i.provider,
                syncFrequency: integrationFormData.syncFrequency || i.syncFrequency,
                dataFlow: integrationFormData.dataFlow || i.dataFlow,
                notes: integrationFormData.notes || i.notes,
              }
            : i
        )
      );
      setShowIntegrationModal(false);
      setEditingIntegration(null);
      setIntegrationFormData({});
    }
  };

  const deleteIntegration = (id: string) => {
    setIntegrations(integrations.filter((i) => i.id !== id));
  };

  // Contact handlers
  const handleAddContact = () => {
    if (contactFormData.name && contactFormData.email) {
      const newContact: HelpDeskContact = {
        id: String(contacts.length + 1),
        name: contactFormData.name,
        role: contactFormData.role || 'Support Staff',
        department: contactFormData.department || 'Support',
        phone: contactFormData.phone || '',
        email: contactFormData.email,
        availability: contactFormData.availability || 'available',
        specialization: contactFormData.specialization || 'General Support',
        notes: contactFormData.notes || '',
      };
      setContacts([newContact, ...contacts]);
      setShowContactModal(false);
      setContactFormData({});
    }
  };

  const handleEditContact = (contact: HelpDeskContact) => {
    setEditingContact(contact);
    setContactFormData(contact);
    setShowContactModal(true);
  };

  const handleSaveContact = () => {
    if (editingContact && contactFormData.name && contactFormData.email) {
      setContacts(
        contacts.map((c) =>
          c.id === editingContact.id
            ? {
                ...c,
                name: contactFormData.name || c.name,
                role: contactFormData.role || c.role,
                department: contactFormData.department || c.department,
                phone: contactFormData.phone || c.phone,
                email: contactFormData.email || c.email,
                availability: contactFormData.availability || c.availability,
                specialization: contactFormData.specialization || c.specialization,
                notes: contactFormData.notes || c.notes,
              }
            : c
        )
      );
      setShowContactModal(false);
      setEditingContact(null);
      setContactFormData({});
    }
  };

  const deleteContact = (id: string) => {
    setContacts(contacts.filter((c) => c.id !== id));
  };

  // Filter data based on search
  const filteredServers = servers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.ipAddress.includes(searchQuery) ||
      s.location.toLowerCase().includes(searchQuery)
  );

  const filteredProcesses = processes.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.hostServer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredIntegrations = integrations.filter(
    (i) =>
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.provider.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  // Statistics
  const stats = [
    { label: 'Total Assets', value: servers.length + processes.length + integrations.length, color: '#2563eb' },
    { label: 'Servers Online', value: servers.filter((s) => s.status === 'online').length, color: '#16a34a' },
    { label: 'Integrations Active', value: integrations.filter((i) => i.status === 'active').length, color: '#9333ea' },
    { label: 'Support Contacts', value: contacts.length, color: '#ea580c' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
      case 'running':
      case 'active':
      case 'available':
        return '#16a34a';
      case 'offline':
      case 'stopped':
      case 'error':
      case 'unavailable':
        return '#dc2626';
      case 'maintenance':
      case 'on-break':
        return '#f59e0b';
      default:
        return '#64748b';
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8, color: '#1e293b' }}>Assets Inventory</h1>
        <p style={{ color: '#64748b', marginBottom: 24 }}>Manage servers, processes, integrations, and help desk contacts</p>

        {/* Statistics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {stats.map((stat, idx) => (
            <div
              key={idx}
              style={{
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: 16,
              }}
            >
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>{stat.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Search and Controls */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 250 }}>
          <Search size={18} color="#64748b" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              fontSize: 14,
              outline: 'none',
            }}
          />
        </div>
        <button
          onClick={() => {
            if (activeTab === 'servers') {
              setEditingServer(null);
              setServerFormData({});
              setShowServerModal(true);
            } else if (activeTab === 'processes') {
              setEditingProcess(null);
              setProcessFormData({});
              setShowProcessModal(true);
            } else if (activeTab === 'integrations') {
              setEditingIntegration(null);
              setIntegrationFormData({});
              setShowIntegrationModal(true);
            } else {
              setEditingContact(null);
              setContactFormData({});
              setShowContactModal(true);
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            background: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          <Plus size={18} />
          Add Asset
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #e2e8f0', marginBottom: 24 }}>
        {(['servers', 'processes', 'integrations', 'contacts'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 16px',
              background: activeTab === tab ? '#2563eb' : 'transparent',
              color: activeTab === tab ? 'white' : '#64748b',
              border: 'none',
              borderRadius: '6px 6px 0 0',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14,
              textTransform: 'capitalize',
            }}
          >
            {tab === 'servers' && <Server size={16} style={{ display: 'inline', marginRight: 6 }} />}
            {tab === 'processes' && <Zap size={16} style={{ display: 'inline', marginRight: 6 }} />}
            {tab === 'integrations' && <Link2 size={16} style={{ display: 'inline', marginRight: 6 }} />}
            {tab === 'contacts' && <Phone size={16} style={{ display: 'inline', marginRight: 6 }} />}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Servers Tab */}
      {activeTab === 'servers' && (
        <div style={{ background: 'white', borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          {filteredServers.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#1e293b' }}>Name</th>
                    <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#1e293b' }}>IP Address</th>
                    <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#1e293b' }}>Status</th>
                    <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#1e293b' }}>Type</th>
                    <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#1e293b' }}>Location</th>
                    <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#1e293b' }}>Resources</th>
                    <th style={{ padding: 12, textAlign: 'center', fontWeight: 600, color: '#1e293b' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredServers.map((server) => (
                    <tr key={server.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: 12 }}>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{server.name}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{server.osType}</div>
                      </td>
                      <td style={{ padding: 12, fontFamily: 'monospace', color: '#1e293b' }}>{server.ipAddress}</td>
                      <td style={{ padding: 12 }}>
                        <span
                          style={{
                            padding: '4px 8px',
                            background: getStatusColor(server.status) + '20',
                            color: getStatusColor(server.status),
                            borderRadius: 4,
                            fontSize: 12,
                            fontWeight: 600,
                            textTransform: 'capitalize',
                          }}
                        >
                          {server.status}
                        </span>
                      </td>
                      <td style={{ padding: 12, textTransform: 'capitalize', color: '#1e293b' }}>{server.type}</td>
                      <td style={{ padding: 12, color: '#1e293b' }}>{server.location}</td>
                      <td style={{ padding: 12, fontSize: 12, color: '#64748b' }}>
                        {server.cpuCores} CPUs, {server.memoryGB}GB RAM, {server.diskGB}GB Disk
                      </td>
                      <td style={{ padding: 12, display: 'flex', gap: 8, justifyContent: 'center' }}>
                        <button
                          onClick={() => handleEditServer(server)}
                          style={{
                            padding: '6px 8px',
                            background: '#dbeafe',
                            color: '#2563eb',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: 12,
                          }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => deleteServer(server.id)}
                          style={{
                            padding: '6px 8px',
                            background: '#fee2e2',
                            color: '#dc2626',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: 12,
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>No servers found</div>
          )}
        </div>
      )}

      {/* Processes Tab */}
      {activeTab === 'processes' && (
        <div style={{ background: 'white', borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          {filteredProcesses.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#1e293b' }}>Name</th>
                    <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#1e293b' }}>Status</th>
                    <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#1e293b' }}>Host Server</th>
                    <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#1e293b' }}>Port</th>
                    <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#1e293b' }}>Resources</th>
                    <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#1e293b' }}>Version</th>
                    <th style={{ padding: 12, textAlign: 'center', fontWeight: 600, color: '#1e293b' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProcesses.map((process) => (
                    <tr key={process.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: 12 }}>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{process.name}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>Uptime: {process.uptime}</div>
                      </td>
                      <td style={{ padding: 12 }}>
                        <span
                          style={{
                            padding: '4px 8px',
                            background: getStatusColor(process.status) + '20',
                            color: getStatusColor(process.status),
                            borderRadius: 4,
                            fontSize: 12,
                            fontWeight: 600,
                            textTransform: 'capitalize',
                          }}
                        >
                          {process.status}
                        </span>
                      </td>
                      <td style={{ padding: 12, color: '#1e293b' }}>{process.hostServer}</td>
                      <td style={{ padding: 12, fontFamily: 'monospace', color: '#1e293b' }}>{process.port || 'N/A'}</td>
                      <td style={{ padding: 12, fontSize: 12, color: '#64748b' }}>
                        CPU: {process.cpuUsage.toFixed(1)}%, Mem: {process.memoryUsage}MB
                      </td>
                      <td style={{ padding: 12, color: '#1e293b' }}>{process.version}</td>
                      <td style={{ padding: 12, display: 'flex', gap: 8, justifyContent: 'center' }}>
                        <button
                          onClick={() => handleEditProcess(process)}
                          style={{
                            padding: '6px 8px',
                            background: '#dbeafe',
                            color: '#2563eb',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: 12,
                          }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => deleteProcess(process.id)}
                          style={{
                            padding: '6px 8px',
                            background: '#fee2e2',
                            color: '#dc2626',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: 12,
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>No processes found</div>
          )}
        </div>
      )}

      {/* Integrations Tab */}
      {activeTab === 'integrations' && (
        <div style={{ background: 'white', borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          {filteredIntegrations.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#1e293b' }}>Name</th>
                    <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#1e293b' }}>Type</th>
                    <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#1e293b' }}>Provider</th>
                    <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#1e293b' }}>Status</th>
                    <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#1e293b' }}>Data Flow</th>
                    <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#1e293b' }}>Last Sync</th>
                    <th style={{ padding: 12, textAlign: 'center', fontWeight: 600, color: '#1e293b' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIntegrations.map((integration) => (
                    <tr key={integration.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: 12 }}>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{integration.name}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>Frequency: {integration.syncFrequency}</div>
                      </td>
                      <td style={{ padding: 12, textTransform: 'capitalize', color: '#1e293b' }}>{integration.type}</td>
                      <td style={{ padding: 12, color: '#1e293b' }}>{integration.provider}</td>
                      <td style={{ padding: 12 }}>
                        <span
                          style={{
                            padding: '4px 8px',
                            background: getStatusColor(integration.status) + '20',
                            color: getStatusColor(integration.status),
                            borderRadius: 4,
                            fontSize: 12,
                            fontWeight: 600,
                            textTransform: 'capitalize',
                          }}
                        >
                          {integration.status}
                        </span>
                      </td>
                      <td style={{ padding: 12, textTransform: 'capitalize', color: '#1e293b' }}>{integration.dataFlow}</td>
                      <td style={{ padding: 12, fontSize: 12, color: '#64748b' }}>{integration.lastSync}</td>
                      <td style={{ padding: 12, display: 'flex', gap: 8, justifyContent: 'center' }}>
                        <button
                          onClick={() => handleEditIntegration(integration)}
                          style={{
                            padding: '6px 8px',
                            background: '#dbeafe',
                            color: '#2563eb',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: 12,
                          }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => deleteIntegration(integration.id)}
                          style={{
                            padding: '6px 8px',
                            background: '#fee2e2',
                            color: '#dc2626',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: 12,
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>No integrations found</div>
          )}
        </div>
      )}

      {/* Contacts Tab */}
      {activeTab === 'contacts' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filteredContacts.length > 0 ? (
            filteredContacts.map((contact) => (
              <div
                key={contact.id}
                style={{
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  padding: 16,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1e293b', marginBottom: 2 }}>{contact.name}</h3>
                    <p style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{contact.role}</p>
                  </div>
                  <span
                    style={{
                      padding: '4px 8px',
                      background: getStatusColor(contact.availability) + '20',
                      color: getStatusColor(contact.availability),
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: 'capitalize',
                    }}
                  >
                    {contact.availability}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div>
                    <strong>Department:</strong> {contact.department}
                  </div>
                  <div>
                    <strong>Email:</strong> {contact.email}
                  </div>
                  <div>
                    <strong>Phone:</strong> {contact.phone}
                  </div>
                  <div>
                    <strong>Specialization:</strong> {contact.specialization}
                  </div>
                </div>
                {contact.notes && (
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12, fontStyle: 'italic' }}>
                    <strong>Notes:</strong> {contact.notes}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleEditContact(contact)}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      background: '#dbeafe',
                      color: '#2563eb',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    <Edit2 size={14} style={{ display: 'inline', marginRight: 4 }} />
                    Edit
                  </button>
                  <button
                    onClick={() => deleteContact(contact.id)}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      background: '#fee2e2',
                      color: '#dc2626',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    <Trash2 size={14} style={{ display: 'inline', marginRight: 4 }} />
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: 32, textAlign: 'center', color: '#64748b', gridColumn: '1 / -1' }}>
              No contacts found
            </div>
          )}
        </div>
      )}

      {/* Server Modal */}
      {showServerModal && (
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
            zIndex: 1000,
          }}
          onClick={() => setShowServerModal(false)}
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
            <h2 style={{ marginBottom: 20 }}>{editingServer ? 'Edit Server' : 'Add New Server'}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <input
                type="text"
                placeholder="Server Name"
                value={serverFormData.name || ''}
                onChange={(e) => setServerFormData({ ...serverFormData, name: e.target.value })}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  fontSize: 14,
                  outline: 'none',
                }}
              />
              <input
                type="text"
                placeholder="IP Address"
                value={serverFormData.ipAddress || ''}
                onChange={(e) => setServerFormData({ ...serverFormData, ipAddress: e.target.value })}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  fontSize: 14,
                  outline: 'none',
                }}
              />
              <select
                value={serverFormData.status || 'offline'}
                onChange={(e) => setServerFormData({ ...serverFormData, status: e.target.value as any })}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  fontSize: 14,
                  outline: 'none',
                }}
              >
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="maintenance">Maintenance</option>
              </select>
              <select
                value={serverFormData.type || 'web'}
                onChange={(e) => setServerFormData({ ...serverFormData, type: e.target.value as any })}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  fontSize: 14,
                  outline: 'none',
                }}
              >
                <option value="web">Web</option>
                <option value="database">Database</option>
                <option value="cache">Cache</option>
                <option value="queue">Queue</option>
                <option value="storage">Storage</option>
              </select>
              <input
                type="text"
                placeholder="Location"
                value={serverFormData.location || ''}
                onChange={(e) => setServerFormData({ ...serverFormData, location: e.target.value })}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  fontSize: 14,
                  outline: 'none',
                }}
              />
              <input
                type="text"
                placeholder="OS Type"
                value={serverFormData.osType || ''}
                onChange={(e) => setServerFormData({ ...serverFormData, osType: e.target.value })}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  fontSize: 14,
                  outline: 'none',
                }}
              />
              <input
                type="number"
                placeholder="CPU Cores"
                value={serverFormData.cpuCores || ''}
                onChange={(e) => setServerFormData({ ...serverFormData, cpuCores: Number(e.target.value) })}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  fontSize: 14,
                  outline: 'none',
                }}
              />
              <input
                type="number"
                placeholder="Memory (GB)"
                value={serverFormData.memoryGB || ''}
                onChange={(e) => setServerFormData({ ...serverFormData, memoryGB: Number(e.target.value) })}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  fontSize: 14,
                  outline: 'none',
                }}
              />
              <input
                type="number"
                placeholder="Disk (GB)"
                value={serverFormData.diskGB || ''}
                onChange={(e) => setServerFormData({ ...serverFormData, diskGB: Number(e.target.value) })}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  fontSize: 14,
                  outline: 'none',
                }}
              />
            </div>
            <textarea
              placeholder="Notes"
              value={serverFormData.notes || ''}
              onChange={(e) => setServerFormData({ ...serverFormData, notes: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: 6,
                fontSize: 14,
                minHeight: 60,
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                marginBottom: 20,
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowServerModal(false)}
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
                onClick={editingServer ? handleSaveServer : handleAddServer}
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
                {editingServer ? 'Save' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Process Modal */}
      {showProcessModal && (
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
            zIndex: 1000,
          }}
          onClick={() => setShowProcessModal(false)}
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
            <h2 style={{ marginBottom: 20 }}>{editingProcess ? 'Edit Process' : 'Add New Process'}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <input
                type="text"
                placeholder="Process Name"
                value={processFormData.name || ''}
                onChange={(e) => setProcessFormData({ ...processFormData, name: e.target.value })}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  fontSize: 14,
                  outline: 'none',
                  gridColumn: '1 / -1',
                }}
              />
              <select
                value={processFormData.status || 'stopped'}
                onChange={(e) => setProcessFormData({ ...processFormData, status: e.target.value as any })}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  fontSize: 14,
                  outline: 'none',
                }}
              >
                <option value="running">Running</option>
                <option value="stopped">Stopped</option>
                <option value="error">Error</option>
              </select>
              <input
                type="text"
                placeholder="Host Server"
                value={processFormData.hostServer || ''}
                onChange={(e) => setProcessFormData({ ...processFormData, hostServer: e.target.value })}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  fontSize: 14,
                  outline: 'none',
                }}
              />
              <input
                type="number"
                placeholder="Port"
                value={processFormData.port || ''}
                onChange={(e) => setProcessFormData({ ...processFormData, port: Number(e.target.value) })}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  fontSize: 14,
                  outline: 'none',
                }}
              />
              <input
                type="number"
                placeholder="CPU Usage %"
                value={processFormData.cpuUsage || ''}
                onChange={(e) => setProcessFormData({ ...processFormData, cpuUsage: Number(e.target.value) })}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  fontSize: 14,
                  outline: 'none',
                }}
              />
              <input
                type="number"
                placeholder="Memory Usage (MB)"
                value={processFormData.memoryUsage || ''}
                onChange={(e) => setProcessFormData({ ...processFormData, memoryUsage: Number(e.target.value) })}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  fontSize: 14,
                  outline: 'none',
                }}
              />
              <input
                type="text"
                placeholder="Uptime"
                value={processFormData.uptime || ''}
                onChange={(e) => setProcessFormData({ ...processFormData, uptime: e.target.value })}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  fontSize: 14,
                  outline: 'none',
                }}
              />
              <input
                type="text"
                placeholder="Version"
                value={processFormData.version || ''}
                onChange={(e) => setProcessFormData({ ...processFormData, version: e.target.value })}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  fontSize: 14,
                  outline: 'none',
                }}
              />
            </div>
            <textarea
              placeholder="Notes"
              value={processFormData.notes || ''}
              onChange={(e) => setProcessFormData({ ...processFormData, notes: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: 6,
                fontSize: 14,
                minHeight: 60,
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                marginBottom: 20,
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowProcessModal(false)}
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
                onClick={editingProcess ? handleSaveProcess : handleAddProcess}
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
                {editingProcess ? 'Save' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Integration Modal */}
      {showIntegrationModal && (
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
            zIndex: 1000,
          }}
          onClick={() => setShowIntegrationModal(false)}
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
            <h2 style={{ marginBottom: 20 }}>{editingIntegration ? 'Edit Integration' : 'Add New Integration'}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <input
                type="text"
                placeholder="Integration Name"
                value={integrationFormData.name || ''}
                onChange={(e) => setIntegrationFormData({ ...integrationFormData, name: e.target.value })}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  fontSize: 14,
                  outline: 'none',
                  gridColumn: '1 / -1',
                }}
              />
              <select
                value={integrationFormData.type || 'api'}
                onChange={(e) => setIntegrationFormData({ ...integrationFormData, type: e.target.value as any })}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  fontSize: 14,
                  outline: 'none',
                }}
              >
                <option value="api">API</option>
                <option value="webhook">Webhook</option>
                <option value="database">Database</option>
                <option value="service">Service</option>
                <option value="custom">Custom</option>
              </select>
              <input
                type="text"
                placeholder="Provider"
                value={integrationFormData.provider || ''}
                onChange={(e) => setIntegrationFormData({ ...integrationFormData, provider: e.target.value })}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  fontSize: 14,
                  outline: 'none',
                }}
              />
              <select
                value={integrationFormData.status || 'inactive'}
                onChange={(e) => setIntegrationFormData({ ...integrationFormData, status: e.target.value as any })}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  fontSize: 14,
                  outline: 'none',
                }}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="error">Error</option>
              </select>
              <select
                value={integrationFormData.syncFrequency || 'hourly'}
                onChange={(e) => setIntegrationFormData({ ...integrationFormData, syncFrequency: e.target.value })}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  fontSize: 14,
                  outline: 'none',
                }}
              >
                <option value="real-time">Real-time</option>
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
              <select
                value={integrationFormData.dataFlow || 'inbound'}
                onChange={(e) => setIntegrationFormData({ ...integrationFormData, dataFlow: e.target.value as any })}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  fontSize: 14,
                  outline: 'none',
                }}
              >
                <option value="inbound">Inbound</option>
                <option value="outbound">Outbound</option>
                <option value="bidirectional">Bidirectional</option>
              </select>
            </div>
            <textarea
              placeholder="Notes"
              value={integrationFormData.notes || ''}
              onChange={(e) => setIntegrationFormData({ ...integrationFormData, notes: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: 6,
                fontSize: 14,
                minHeight: 60,
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                marginBottom: 20,
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowIntegrationModal(false)}
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
                onClick={editingIntegration ? handleSaveIntegration : handleAddIntegration}
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
                {editingIntegration ? 'Save' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContactModal && (
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
            zIndex: 1000,
          }}
          onClick={() => setShowContactModal(false)}
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
            <h2 style={{ marginBottom: 20 }}>{editingContact ? 'Edit Contact' : 'Add New Contact'}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <input
                type="text"
                placeholder="Full Name"
                value={contactFormData.name || ''}
                onChange={(e) => setContactFormData({ ...contactFormData, name: e.target.value })}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  fontSize: 14,
                  outline: 'none',
                  gridColumn: '1 / -1',
                }}
              />
              <input
                type="text"
                placeholder="Role"
                value={contactFormData.role || ''}
                onChange={(e) => setContactFormData({ ...contactFormData, role: e.target.value })}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  fontSize: 14,
                  outline: 'none',
                }}
              />
              <input
                type="text"
                placeholder="Department"
                value={contactFormData.department || ''}
                onChange={(e) => setContactFormData({ ...contactFormData, department: e.target.value })}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  fontSize: 14,
                  outline: 'none',
                }}
              />
              <input
                type="email"
                placeholder="Email"
                value={contactFormData.email || ''}
                onChange={(e) => setContactFormData({ ...contactFormData, email: e.target.value })}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  fontSize: 14,
                  outline: 'none',
                }}
              />
              <input
                type="tel"
                placeholder="Phone"
                value={contactFormData.phone || ''}
                onChange={(e) => setContactFormData({ ...contactFormData, phone: e.target.value })}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  fontSize: 14,
                  outline: 'none',
                }}
              />
              <select
                value={contactFormData.availability || 'available'}
                onChange={(e) => setContactFormData({ ...contactFormData, availability: e.target.value as any })}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  fontSize: 14,
                  outline: 'none',
                }}
              >
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
                <option value="on-break">On Break</option>
              </select>
              <input
                type="text"
                placeholder="Specialization"
                value={contactFormData.specialization || ''}
                onChange={(e) => setContactFormData({ ...contactFormData, specialization: e.target.value })}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  fontSize: 14,
                  outline: 'none',
                  gridColumn: '1 / -1',
                }}
              />
            </div>
            <textarea
              placeholder="Notes"
              value={contactFormData.notes || ''}
              onChange={(e) => setContactFormData({ ...contactFormData, notes: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: 6,
                fontSize: 14,
                minHeight: 60,
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                marginBottom: 20,
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowContactModal(false)}
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
                onClick={editingContact ? handleSaveContact : handleAddContact}
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
                {editingContact ? 'Save' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
