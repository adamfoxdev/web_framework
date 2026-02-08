import { useState } from 'react';
import { Plus, Trash2, Edit2, Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee: string;
  progress: number; // 0-100
  dependencies?: string[]; // task IDs
  project: string;
  notes: string;
}

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Database Migration',
    description: 'Migrate PostgreSQL 12 to PostgreSQL 14',
    startDate: '2026-02-08',
    endDate: '2026-02-15',
    status: 'in-progress',
    priority: 'high',
    assignee: 'Sarah Johnson',
    progress: 65,
    project: 'Infrastructure',
    notes: 'On track',
  },
  {
    id: '2',
    title: 'API Performance Optimization',
    description: 'Optimize response times for critical endpoints',
    startDate: '2026-02-10',
    endDate: '2026-02-20',
    status: 'in-progress',
    priority: 'high',
    assignee: 'Mike Davis',
    progress: 40,
    dependencies: ['1'],
    project: 'Backend',
    notes: 'Waiting for DB migration',
  },
  {
    id: '3',
    title: 'Frontend Redesign',
    description: 'Redesign dashboard components',
    startDate: '2026-02-05',
    endDate: '2026-02-18',
    status: 'in-progress',
    priority: 'medium',
    assignee: 'John Smith',
    progress: 55,
    project: 'Frontend',
    notes: 'Feedback pending',
  },
  {
    id: '4',
    title: 'Security Audit',
    description: 'Full security assessment and testing',
    startDate: '2026-02-15',
    endDate: '2026-02-25',
    status: 'pending',
    priority: 'critical',
    assignee: 'Sarah Johnson',
    progress: 0,
    project: 'Security',
    notes: 'Starting next week',
  },
  {
    id: '5',
    title: 'Documentation Update',
    description: 'Update API documentation for v3.0',
    startDate: '2026-02-08',
    endDate: '2026-02-12',
    status: 'completed',
    priority: 'low',
    assignee: 'Mike Davis',
    progress: 100,
    project: 'Documentation',
    notes: 'Completed early',
  },
  {
    id: '6',
    title: 'Load Testing',
    description: 'Perform load and stress testing',
    startDate: '2026-02-20',
    endDate: '2026-02-28',
    status: 'pending',
    priority: 'high',
    assignee: 'John Smith',
    progress: 0,    
    project: 'QA',
    notes: 'Scheduled for next month',
  },
];

export default function CalendarPage() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [currentDate, setCurrentDate] = useState(new Date(2026, 1, 8)); // February 8, 2026
  const [view, setView] = useState<'month' | 'gantt'>('gantt');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskFormData, setTaskFormData] = useState<Partial<Task>>({});
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterProject, setFilterProject] = useState<string>('all');

  // Get unique projects
  const projects = Array.from(new Set(tasks.map(t => t.project)));
  
  // Get unique assignees
  const assignees = Array.from(new Set(tasks.map(t => t.assignee)));

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         t.assignee.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    const matchesProject = filterProject === 'all' || t.project === filterProject;
    return matchesSearch && matchesStatus && matchesProject;
  });

  // Calendar helpers
  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const monthDays = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = Array.from({ length: monthDays }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleAddTask = () => {
    if (taskFormData.title && taskFormData.startDate && taskFormData.endDate) {
      const newTask: Task = {
        id: String(tasks.length + 1),
        title: taskFormData.title,
        description: taskFormData.description || '',
        startDate: taskFormData.startDate,
        endDate: taskFormData.endDate,
        status: taskFormData.status || 'pending',
        priority: taskFormData.priority || 'medium',
        assignee: taskFormData.assignee || 'Unassigned',
        progress: taskFormData.progress || 0,
        project: taskFormData.project || 'General',
        notes: taskFormData.notes || '',
        dependencies: taskFormData.dependencies,
      };
      setTasks([newTask, ...tasks]);
      setShowTaskModal(false);
      setTaskFormData({});
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskFormData(task);
    setShowTaskModal(true);
  };

  const handleSaveTask = () => {
    if (editingTask && taskFormData.title && taskFormData.startDate && taskFormData.endDate) {
      setTasks(
        tasks.map(t =>
          t.id === editingTask.id
            ? {
                ...t,
                title: taskFormData.title || t.title,
                description: taskFormData.description || t.description,
                startDate: taskFormData.startDate || t.startDate,
                endDate: taskFormData.endDate || t.endDate,
                status: taskFormData.status || t.status,
                priority: taskFormData.priority || t.priority,
                assignee: taskFormData.assignee || t.assignee,
                progress: taskFormData.progress || t.progress,
                project: taskFormData.project || t.project,
                notes: taskFormData.notes || t.notes,
              }
            : t
        )
      );
      setShowTaskModal(false);
      setEditingTask(null);
      setTaskFormData({});
    }
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#16a34a';
      case 'in-progress':
        return '#2563eb';
      case 'pending':
        return '#f59e0b';
      case 'blocked':
        return '#dc2626';
      default:
        return '#64748b';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return '#dc2626';
      case 'high':
        return '#f59e0b';
      case 'medium':
        return '#2563eb';
      case 'low':
        return '#16a34a';
      default:
        return '#64748b';
    }
  };

  // Gantt chart logic
  const ganttStartDate = new Date(2026, 1, 1); // Feb 1
  const ganttEndDate = new Date(2026, 2, 28); // Feb 28 (adjusted for Gantt view)
  const ganttDays = Math.ceil((ganttEndDate.getTime() - ganttStartDate.getTime()) / (1000 * 60 * 60 * 24));

  const getTaskPosition = (taskStartDate: string) => {
    const taskDate = new Date(taskStartDate).getTime();
    const startTime = ganttStartDate.getTime();
    const daysDiff = Math.floor((taskDate - startTime) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysDiff);
  };

  const getTaskWidth = (taskStartDate: string, taskEndDate: string) => {
    const startDate = new Date(taskStartDate).getTime();
    const endDate = new Date(taskEndDate).getTime();
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    return Math.max(1, daysDiff);
  };

  // Stats
  const stats = [
    { label: 'Total Tasks', value: tasks.length, color: '#2563eb' },
    { label: 'In Progress', value: tasks.filter(t => t.status === 'in-progress').length, color: '#f59e0b' },
    { label: 'Completed', value: tasks.filter(t => t.status === 'completed').length, color: '#16a34a' },
    { label: 'Blocked', value: tasks.filter(t => t.status === 'blocked').length, color: '#dc2626' },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: 1600, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8, color: '#1e293b' }}>Calendar & Gantt</h1>
        <p style={{ color: '#64748b', marginBottom: 24 }}>Project timeline and task management</p>

        {/* Statistics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
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
            placeholder="Search tasks..."
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
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #cbd5e1',
            borderRadius: 6,
            fontSize: 14,
            outline: 'none',
          }}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="blocked">Blocked</option>
        </select>
        <select
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #cbd5e1',
            borderRadius: 6,
            fontSize: 14,
            outline: 'none',
          }}
        >
          <option value="all">All Projects</option>
          {projects.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <button
          onClick={() => {
            setEditingTask(null);
            setTaskFormData({});
            setShowTaskModal(true);
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
          New Task
        </button>
      </div>

      {/* View Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {(['month', 'gantt'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              padding: '8px 16px',
              background: view === v ? '#2563eb' : '#f1f5f9',
              color: view === v ? 'white' : '#1e293b',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14,
              textTransform: 'capitalize',
            }}
          >
            {v === 'gantt' ? 'Gantt Chart' : 'Calendar'}
          </button>
        ))}
      </div>

      {/* Calendar View */}
      {view === 'month' && (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b' }}>
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                style={{
                  padding: '8px 12px',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  cursor: 'pointer',
                }}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setCurrentDate(new Date(2026, 1, 8))}
                style={{
                  padding: '8px 12px',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                Today
              </button>
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                style={{
                  padding: '8px 12px',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  cursor: 'pointer',
                }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
            {/* Day headers */}
            {dayNames.map(day => (
              <div
                key={day}
                style={{
                  padding: 12,
                  textAlign: 'center',
                  fontWeight: 700,
                  color: '#64748b',
                  fontSize: 12,
                  textTransform: 'uppercase',
                }}
              >
                {day}
              </div>
            ))}

            {/* Empty days */}
            {emptyDays.map(i => (
              <div key={`empty-${i}`} style={{ padding: 12, minHeight: 100 }} />
            ))}

            {/* Calendar days */}
            {days.map(day => {
              const dateStr = `2026-02-${String(day).padStart(2, '0')}`;
              const dayTasks = tasks.filter(t => {
                const taskStart = new Date(t.startDate);
                const taskEnd = new Date(t.endDate);
                const current = new Date(dateStr);
                return current >= taskStart && current <= taskEnd;
              });

              return (
                <div
                  key={day}
                  style={{
                    padding: 12,
                    minHeight: 100,
                    background: day === 8 ? '#f0f9ff' : 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: 6,
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 4, color: '#1e293b' }}>{day}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {dayTasks.slice(0, 2).map(task => (
                      <div
                        key={task.id}
                        style={{
                          padding: '4px 6px',
                          background: getStatusColor(task.status) + '20',
                          color: getStatusColor(task.status),
                          borderRadius: 3,
                          fontSize: 10,
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {task.title}
                      </div>
                    ))}
                    {dayTasks.length > 2 && (
                      <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>
                        +{dayTasks.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Gantt View */}
      {view === 'gantt' && (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'flex' }}>
              {/* Task List */}
              <div style={{ minWidth: 300, borderRight: '1px solid #e2e8f0' }}>
                {filteredTasks.length > 0 ? (
                  filteredTasks.map((task) => (
                    <div
                      key={task.id}
                      style={{
                        padding: 12,
                        borderBottom: '1px solid #e2e8f0',
                        minHeight: 80,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 13, marginBottom: 4 }}>
                          {task.title}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>
                          {task.assignee}
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <span
                            style={{
                              padding: '2px 6px',
                              background: getStatusColor(task.status) + '20',
                              color: getStatusColor(task.status),
                              borderRadius: 3,
                              fontSize: 10,
                              fontWeight: 600,
                              textTransform: 'capitalize',
                            }}
                          >
                            {task.status}
                          </span>
                          <span
                            style={{
                              padding: '2px 6px',
                              background: getPriorityColor(task.priority) + '20',
                              color: getPriorityColor(task.priority),
                              borderRadius: 3,
                              fontSize: 10,
                              fontWeight: 600,
                              textTransform: 'capitalize',
                            }}
                          >
                            {task.priority}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => handleEditTask(task)}
                          style={{
                            flex: 1,
                            padding: '4px 6px',
                            background: '#dbeafe',
                            color: '#2563eb',
                            border: 'none',
                            borderRadius: 3,
                            cursor: 'pointer',
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          <Edit2 size={12} style={{ display: 'inline', marginRight: 2 }} />
                          Edit
                        </button>
                        <button
                          onClick={() => deleteTask(task.id)}
                          style={{
                            flex: 1,
                            padding: '4px 6px',
                            background: '#fee2e2',
                            color: '#dc2626',
                            border: 'none',
                            borderRadius: 3,
                            cursor: 'pointer',
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          <Trash2 size={12} style={{ display: 'inline', marginRight: 2 }} />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>No tasks found</div>
                )}
              </div>

              {/* Timeline */}
              <div style={{ flex: 1, minWidth: 1000 }}>
                {/* Timeline Header */}
                <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
                  {Array.from({ length: Math.ceil(ganttDays / 7) }).map((_, week) => {
                    const weekStart = new Date(ganttStartDate);
                    weekStart.setDate(weekStart.getDate() + week * 7);
                    return (
                      <div
                        key={week}
                        style={{
                          flex: 1,
                          minWidth: 140,
                          padding: 8,
                          background: '#f8fafc',
                          borderRight: '1px solid #e2e8f0',
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#64748b',
                          textAlign: 'center',
                        }}
                      >
                        Week {week + 1}
                      </div>
                    );
                  })}
                </div>

                {/* Timeline Rows */}
                {filteredTasks.length > 0 ? (
                  filteredTasks.map((task) => {
                    const left = getTaskPosition(task.startDate) * (140 / 7);
                    const width = getTaskWidth(task.startDate, task.endDate) * (140 / 7);

                    return (
                      <div
                        key={task.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          minHeight: 80,
                          borderBottom: '1px solid #e2e8f0',
                          position: 'relative',
                          padding: '8px 12px',
                        }}
                      >
                        {/* Progress bar background */}
                        <div
                          style={{
                            position: 'absolute',
                            left: `${left}px`,
                            width: `${Math.max(120, width)}px`,
                            height: 32,
                            background: getStatusColor(task.status) + '20',
                            borderRadius: 4,
                            border: `2px solid ${getStatusColor(task.status)}`,
                          }}
                        />

                        {/* Progress bar fill */}
                        <div
                          style={{
                            position: 'absolute',
                            left: `${left + 2}px`,
                            width: `${(Math.max(120, width) - 4) * (task.progress / 100)}px`,
                            height: 28,
                            background: getStatusColor(task.status),
                            borderRadius: 2,
                          }}
                        />

                        {/* Task label */}
                        <div
                          style={{
                            position: 'absolute',
                            left: `${left + 8}px`,
                            color: 'white',
                            fontSize: 11,
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            zIndex: 1,
                          }}
                        >
                          {task.progress}%
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>No tasks to display</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
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
          onClick={() => setShowTaskModal(false)}
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
            <h2 style={{ marginBottom: 20 }}>{editingTask ? 'Edit Task' : 'Create New Task'}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              <input
                type="text"
                placeholder="Task Title"
                value={taskFormData.title || ''}
                onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  fontSize: 14,
                  outline: 'none',
                }}
              />
              <textarea
                placeholder="Description"
                value={taskFormData.description || ''}
                onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  fontSize: 14,
                  minHeight: 60,
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={taskFormData.startDate || ''}
                    onChange={(e) => setTaskFormData({ ...taskFormData, startDate: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: 6,
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    value={taskFormData.endDate || ''}
                    onChange={(e) => setTaskFormData({ ...taskFormData, endDate: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: 6,
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                    Status
                  </label>
                  <select
                    value={taskFormData.status || 'pending'}
                    onChange={(e) => setTaskFormData({ ...taskFormData, status: e.target.value as any })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: 6,
                      fontSize: 14,
                      outline: 'none',
                    }}
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                    Priority
                  </label>
                  <select
                    value={taskFormData.priority || 'medium'}
                    onChange={(e) => setTaskFormData({ ...taskFormData, priority: e.target.value as any })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: 6,
                      fontSize: 14,
                      outline: 'none',
                    }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                    Assignee
                  </label>
                  <select
                    value={taskFormData.assignee || 'Unassigned'}
                    onChange={(e) => setTaskFormData({ ...taskFormData, assignee: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: 6,
                      fontSize: 14,
                      outline: 'none',
                    }}
                  >
                    <option value="Unassigned">Unassigned</option>
                    {assignees.map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                    Progress (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={taskFormData.progress || 0}
                    onChange={(e) => setTaskFormData({ ...taskFormData, progress: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: 6,
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                  Project
                </label>
                <select
                  value={taskFormData.project || 'General'}
                  onChange={(e) => setTaskFormData({ ...taskFormData, project: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: 6,
                    fontSize: 14,
                    outline: 'none',
                  }}
                >
                  {projects.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                  <option value="General">General</option>
                </select>
              </div>
              <textarea
                placeholder="Notes"
                value={taskFormData.notes || ''}
                onChange={(e) => setTaskFormData({ ...taskFormData, notes: e.target.value })}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  fontSize: 14,
                  minHeight: 60,
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowTaskModal(false)}
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
                onClick={editingTask ? handleSaveTask : handleAddTask}
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
                {editingTask ? 'Save' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
