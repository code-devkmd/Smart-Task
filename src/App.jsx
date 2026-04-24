import { useState, useEffect, useMemo } from 'react';

export default function App() {
  // --- STATE MANAGEMENT ---
  const [tasks, setTasks] = useState(() => {
    const data = localStorage.getItem('SmartTask');
    return data ? JSON.parse(data) : [];
  });

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [filter, setFilter] = useState('all');

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [editTaskId, setEditTaskId] = useState(null);
  const [deleteTaskId, setDeleteTaskId] = useState(null);

  // Unified form state for create/edit
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    dueDate: new Date().toISOString().split('T')[0],
    priority: 'medium',
    commitment: ''
  });

  // Alert Panels dismissal state
  const [enforcementDismissed, setEnforcementDismissed] = useState(false);
  const [celebrationDismissed, setCelebrationDismissed] = useState(false);

  // --- EFFECTS ---
  // Load confetti script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Save tasks to local storage
  useEffect(() => {
    localStorage.setItem('SmartTask', JSON.stringify(tasks));
  }, [tasks]);

  // --- COMPUTED DATA (Stats & Filtering) ---
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const streak = useMemo(() => {
    let s = 0;
    let d = new Date();
    while (true) {
      const dateStr = d.toISOString().split('T')[0];
      const tasksForDay = tasks.filter(t => t.dueDate === dateStr && t.completed);
      if (tasksForDay.length > 0) {
        s++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return s;
  }, [tasks]);

  const skipRate = useMemo(() => {
    const skippedTasks = tasks.filter(t => !t.completed && t.dueDate < todayStr).length;
    const totalTasks = tasks.length;
    return totalTasks > 0 ? Math.round((skippedTasks / totalTasks) * 100) : 0;
  }, [tasks, todayStr]);

  // Auto-reset panel dismissals if conditions drop below threshold
  useEffect(() => {
    if (streak < 3) setCelebrationDismissed(false);
  }, [streak]);

  useEffect(() => {
    if (skipRate <= 30) setEnforcementDismissed(false);
  }, [skipRate]);

  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];
    if (filter === 'today') {
      filtered = tasks.filter(t => t.dueDate === todayStr);
    } else if (filter === 'pending') {
      filtered = tasks.filter(t => !t.completed);
    } else if (filter === 'completed') {
      filtered = tasks.filter(t => t.completed);
    } else if (filter !== 'all') {
      // Date specific filter
      filtered = tasks.filter(t => t.dueDate === filter);
    }
    return filtered.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }, [tasks, filter, todayStr]);

  // --- ACTIONS ---
  const handleCreateTask = () => {
    if (!taskForm.title.trim() || !taskForm.dueDate) return;

    const newTask = {
      id: 'task-' + Date.now(),
      title: taskForm.title.trim(),
      description: taskForm.description.trim(),
      dueDate: taskForm.dueDate,
      priority: taskForm.priority,
      commitment: taskForm.commitment.trim(),
      createdAt: new Date().toISOString(),
      completed: false,
      completedAt: null,
      skippedCount: 0
    };

    setTasks([...tasks, newTask]);
    closeTaskModal();
  };

  const handleSaveEditTask = () => {
    if (!taskForm.title.trim() || !taskForm.dueDate) return;

    setTasks(prev => prev.map(t => t.id === editTaskId ? {
      ...t,
      title: taskForm.title,
      description: taskForm.description,
      dueDate: taskForm.dueDate,
      priority: taskForm.priority,
      commitment: taskForm.commitment
    } : t));

    closeEditTaskModal();
  };

  const handleConfirmDeleteTask = () => {
    setTasks(prev => prev.filter(t => t.id !== deleteTaskId));
    closeDeleteTaskModal();
  };

  const toggleTaskComplete = (taskId) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const isNowCompleted = !t.completed;
        if (isNowCompleted && window.confetti) {
          launchConfetti();
        }
        return {
          ...t,
          completed: isNowCompleted,
          completedAt: isNowCompleted ? new Date().toISOString() : null
        };
      }
      return t;
    }));
  };

  const launchConfetti = () => {
    if (!window.confetti) return;
    const duration = 800;
    const end = Date.now() + duration;

    (function frame() {
      window.confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 } });
      window.confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 } });
      if (Date.now() < end) requestAnimationFrame(frame);
    }());
  };

  // --- MODAL CONTROLS ---
  const openTaskModal = () => {
    setTaskForm({
      title: '', description: '', dueDate: todayStr, priority: 'medium', commitment: ''
    });
    setIsTaskModalOpen(true);
  };

  const closeTaskModal = () => setIsTaskModalOpen(false);

  const openEditTaskModal = (task) => {
    setEditTaskId(task.id);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate,
      priority: task.priority,
      commitment: task.commitment || ''
    });
    setIsEditModalOpen(true);
  };

  const closeEditTaskModal = () => {
    setIsEditModalOpen(false);
    setEditTaskId(null);
  };

  const openDeleteTaskConfirm = (taskId) => {
    setDeleteTaskId(taskId);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteTaskModal = () => {
    setIsDeleteModalOpen(false);
    setDeleteTaskId(null);
  };

  // --- CALENDAR RENDERING LOGIC ---
  const prevCalendarMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextCalendarMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const renderCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const calendarGrid = [];

    // Empty cells
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendarGrid.push(<div key={`empty-${i}`} className="calendar-day placeholder"></div>);
    }

    // Days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const tasksForDay = tasks.filter(t => t.dueDate === dateStr);
      const completedCount = tasksForDay.filter(t => t.completed).length;

      let classNames = "calendar-day";
      let title = dateStr;

      if (dateStr === todayStr) classNames += ' today';

      if (tasksForDay.length > 0) {
        if (completedCount === tasksForDay.length) {
          classNames += ' completed';
          title = `${dateStr} - All tasks completed!`;
        } else if (tasksForDay.some(t => !t.completed && dateStr < todayStr)) {
          classNames += ' skipped';
          title = `${dateStr} - ${tasksForDay.length - completedCount} task(s) overdue`;
        } else {
          classNames += ' pending';
          title = `${dateStr} - ${tasksForDay.length - completedCount} pending task(s)`;
        }
      }

      calendarGrid.push(
        <div
          key={dateStr}
          className={classNames}
          title={title}
          onClick={() => setFilter(dateStr)}
        >
          {day}
          {tasksForDay.length > 0 && (
            <div style={{ fontSize: '9px', opacity: 0.7, marginTop: '2px' }}>
              {completedCount}/{tasksForDay.length}
            </div>
          )}
        </div>
      );
    }

    return calendarGrid;
  };

  return (
    <div className="h-full w-full">
      <div className="page" id="page-todo">
        <div className="page-header">
          <div className="page-header-left">
            <h2>Smart Tasks</h2>
            <p>Track, commit, and build accountability</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={openTaskModal}>
            Add Task
          </button>
        </div>

        <div className="page-body">
          <div className="todo-grid">
            {/* Calendar Panel */}
            <div className="todo-calendar-panel">
              <div className="calendar-header">
                <button className="btn-calendar-nav" onClick={prevCalendarMonth}>←</button>
                <h3>
                  {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h3>
                <button className="btn-calendar-nav" onClick={nextCalendarMonth}>→</button>
              </div>
              <div className="calendar-weekdays">
                <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div>
                <div>Thu</div><div>Fri</div><div>Sat</div>
              </div>
              <div className="calendar-grid">
                {renderCalendarDays()}
              </div>
              <div className="calendar-legend">
                <div className="legend-item"><span className="legend-dot completed"></span> Completed</div>
                <div className="legend-item"><span className="legend-dot pending"></span> Pending</div>
                <div className="legend-item"><span className="legend-dot skipped"></span> Skipped</div>
              </div>
            </div>

            {/* Tasks Panel */}
            <div className="todo-tasks-panel">
              <div className="todo-tabs">
                <button className={`todo-tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
                <button className={`todo-tab ${filter === 'today' ? 'active' : ''}`} onClick={() => setFilter('today')}>Today</button>
                <button className={`todo-tab ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>Pending</button>
                <button className={`todo-tab ${filter === 'completed' ? 'active' : ''}`} onClick={() => setFilter('completed')}>Done</button>
                {filter !== 'all' && filter !== 'today' && filter !== 'pending' && filter !== 'completed' && (
                  <button className="todo-tab active" onClick={() => setFilter(filter)}>{filter}</button>
                )}
              </div>

              <div className="tasks-container">
                {filteredTasks.length === 0 ? (
                  <div className="tasks-empty">
                    <p>No tasks. Create one to get started.</p>
                  </div>
                ) : (
                  filteredTasks.map(task => {
                    const isOverdue = task.dueDate < todayStr && !task.completed;
                    const dueDateStr = new Date(task.dueDate).toLocaleDateString('default', { month: 'short', day: 'numeric', timeZone: 'UTC' });

                    return (
                      <div key={task.id} className={`task-item ${task.priority}-priority ${task.completed ? 'completed' : ''}`}>
                        <div className={`task-checkbox ${task.completed ? 'checked' : ''}`} onClick={() => toggleTaskComplete(task.id)}></div>
                        <div className="task-content">
                          <div className="task-title">{task.title}</div>
                          {task.description && <div className="task-desc">{task.description}</div>}
                          <div className="task-meta">
                            <span className="task-date">{dueDateStr}{isOverdue ? ' (overdue)' : ''}</span>
                            <span className={`task-priority-badge ${task.priority}`}>{task.priority}</span>
                          </div>
                        </div>
                        <div className="task-actions">
                          <button className="task-btn" title="Edit" onClick={() => openEditTaskModal(task)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                          </button>
                          <button className="task-btn" title="Delete" onClick={() => openDeleteTaskConfirm(task.id)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              <line x1="10" y1="11" x2="10" y2="17"></line>
                              <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Enforcement Panel */}
              <div className={`enforcement-panel ${skipRate > 30 && !enforcementDismissed ? 'show' : ''}`} onClick={() => setEnforcementDismissed(true)}>
                <div className="enforcement-header">🚨 Pattern Alert</div>
                <div className="enforcement-content">
                  <p>You're skipping too many tasks!</p>
                  <div className="enforcement-stats">
                    <div className="stat">
                      <span className="stat-label">Skip Rate</span>
                      <span className="stat-value">{skipRate}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Celebration Panel */}
              <div className={`celebration-panel ${streak >= 3 && !celebrationDismissed ? 'show' : ''}`} onClick={() => setCelebrationDismissed(true)}>
                <div className="celebration-header">🎉 Win Streak!</div>
                <div className="celebration-content">
                  <p>🔥 Great streak! Keep it going.</p>
                  <div className="celebration-stats">
                    <div className="stat">
                      <span className="stat-label">Current Streak</span>
                      <span className="stat-value">{streak}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CREATE TASK MODAL */}
      <div className={`modal-overlay ${isTaskModalOpen ? 'open' : ''}`} onMouseDown={(e) => { if (e.target === e.currentTarget) closeTaskModal() }}>
        <div className="modal-box" style={{ maxWidth: '420px' }}>
          <div className="modal-header">
            <h3 className="modal-title">Create Task</h3>
            <button className="btn-icon" onClick={closeTaskModal}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="1" y1="1" x2="13" y2="13" />
                <line x1="13" y1="1" x2="1" y2="13" />
              </svg>
            </button>
          </div>
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label className="form-label">Task Title</label>
            <input className="input" type="text" placeholder="e.g., Complete physics chapter 5" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} />
          </div>
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label className="form-label">Description</label>
            <textarea className="textarea" placeholder="Why is this task important?" style={{ height: '80px' }} value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}></textarea>
          </div>
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label className="form-label">Due Date</label>
            <input className="input" type="date" value={taskForm.dueDate} onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
          </div>
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label className="form-label">Priority</label>
            <select className="sel" value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Commitment (accountability)</label>
            <textarea className="textarea" placeholder="What will you do if you skip this?" style={{ height: '60px' }} value={taskForm.commitment} onChange={e => setTaskForm({ ...taskForm, commitment: e.target.value })}></textarea>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={closeTaskModal}>Cancel</button>
            <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleCreateTask}>Create</button>
          </div>
        </div>
      </div>

      {/* EDIT TASK MODAL */}
      <div className={`modal-overlay ${isEditModalOpen ? 'open' : ''}`} onMouseDown={(e) => { if (e.target === e.currentTarget) closeEditTaskModal() }}>
        <div className="modal-box" style={{ maxWidth: '420px' }}>
          <div className="modal-header">
            <h3 className="modal-title">Edit Task</h3>
            <button className="btn-icon" onClick={closeEditTaskModal}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="1" y1="1" x2="13" y2="13" />
                <line x1="13" y1="1" x2="1" y2="13" />
              </svg>
            </button>
          </div>
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label className="form-label">Task Title</label>
            <input className="input" type="text" placeholder="e.g., Complete physics chapter 5" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} />
          </div>
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label className="form-label">Description</label>
            <textarea className="textarea" placeholder="Why is this task important?" style={{ height: '80px' }} value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}></textarea>
          </div>
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label className="form-label">Due Date</label>
            <input className="input" type="date" value={taskForm.dueDate} onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
          </div>
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label className="form-label">Priority</label>
            <select className="sel" value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Commitment (accountability)</label>
            <textarea className="textarea" placeholder="What will you do if you skip this?" style={{ height: '60px' }} value={taskForm.commitment} onChange={e => setTaskForm({ ...taskForm, commitment: e.target.value })}></textarea>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={closeEditTaskModal}>Cancel</button>
            <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleSaveEditTask}>Save Changes</button>
          </div>
        </div>
      </div>

      {/* DELETE TASK CONFIRMATION */}
      <div className={`modal-overlay ${isDeleteModalOpen ? 'open' : ''}`} onMouseDown={(e) => { if (e.target === e.currentTarget) closeDeleteTaskModal() }}>
        <div className="modal-box" style={{ maxWidth: '360px' }}>
          <div className="modal-header">
            <h3 className="modal-title">Delete Task?</h3>
            <button className="btn-icon" onClick={closeDeleteTaskModal}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="1" y1="1" x2="13" y2="13" />
                <line x1="13" y1="1" x2="1" y2="13" />
              </svg>
            </button>
          </div>
          <p style={{ color: 'var(--text2)', marginBottom: '16px', fontSize: '14px' }}>
            Are you sure you want to delete this task? This action cannot be undone.
          </p>
          <p style={{ color: 'var(--accent)', marginBottom: '16px', fontWeight: 500, padding: '8px', background: 'rgba(91, 94, 245, 0.1)', borderRadius: 'var(--r2)' }}>
            {deleteTaskId && tasks.find(t => t.id === deleteTaskId)?.title}
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={closeDeleteTaskModal}>Cancel</button>
            <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', background: 'var(--rose)', borderColor: 'var(--rose)' }} onClick={handleConfirmDeleteTask}>
              Delete Task
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}