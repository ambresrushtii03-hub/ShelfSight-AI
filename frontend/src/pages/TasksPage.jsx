import { useEffect, useState } from 'react';
import { Check, ClipboardList, RefreshCw } from 'lucide-react';
import { tasksApi } from '../api/tasksApi.js';
import { storesApi } from '../api/storesApi.js';

const taskStatuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [stores, setStores] = useState([]);
  const [filter, setFilter] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [error, setError] = useState('');

  async function loadTasks() {
    setLoading(true);
    setError('');
    try {
      const [taskResponse, storeResponse] = await Promise.all([tasksApi.list(filter ? { status: filter } : {}), storesApi.list({ page: 1, limit: 100 })]);
      setTasks(taskResponse.data.tasks || []);
      setStores(storeResponse.data.stores || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load tasks.');
    } finally { setLoading(false); }
  }

  useEffect(() => { loadTasks(); }, [filter]);

  async function updateStatus(task, status) {
    setSavingId(task.id);
    setError('');
    try {
      await tasksApi.update(task.id, { status, ...(status === 'RESOLVED' ? { resolutionNote: resolutionNotes[task.id] || '' } : {}) });
      await loadTasks();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update task. Add a resolution note before resolving.');
    } finally { setSavingId(''); }
  }

  const storeNames = Object.fromEntries(stores.map((store) => [store.id, store.name]));

  return <div className="page-stack">
    <section className="page-heading"><div><p className="eyebrow">STORE EXECUTION</p><h1>Task queue</h1><p className="muted">Track corrective actions from shelf findings through resolution.</p></div><button className="button button-quiet" onClick={loadTasks}><RefreshCw size={16} /> Refresh</button></section>
    {error && <p className="error-banner">{error}</p>}
    <div className="filter-bar"><div className="filter-tabs" role="tablist" aria-label="Task status">{[['', 'All tasks'], ['OPEN', 'Open'], ['IN_PROGRESS', 'In progress'], ['RESOLVED', 'Resolved']].map(([value, label]) => <button key={label} className={filter === value ? 'filter-tab active' : 'filter-tab'} onClick={() => setFilter(value)}>{label}</button>)}</div><span className="count-label">{tasks.length} tasks</span></div>
    {loading ? <p className="page-loading">Loading tasks...</p> : tasks.length === 0 ? <section className="empty-state"><ClipboardList size={26} /><h3>Task queue is clear</h3><p>Actions created from reviewed findings will appear here.</p></section> : <div className="data-list task-list">
      {tasks.map((task) => <article className="task-row" key={task.id}>
        <div className="task-check"><Check size={16} /></div><div className="row-main"><div className="audit-row-title"><h3>{task.title}</h3><span className={`severity-${String(task.priority).toLowerCase()}`}>{task.priority}</span></div><p>{task.description}</p><div className="task-subline"><span>{storeNames[task.store_id] || 'Store'}</span>{task.due_date && <span>Due {new Date(`${task.due_date}T00:00:00`).toLocaleDateString()}</span>}</div>
          {task.status !== 'RESOLVED' && <input className="resolution-input" aria-label={`Resolution note for ${task.title}`} placeholder="Resolution note (required to resolve)" value={resolutionNotes[task.id] || ''} onChange={(event) => setResolutionNotes({ ...resolutionNotes, [task.id]: event.target.value })} />}
        </div><select aria-label={`Status for ${task.title}`} value={task.status} disabled={savingId === task.id} onChange={(event) => updateStatus(task, event.target.value)}>{taskStatuses.map((status) => <option value={status} key={status}>{status.replaceAll('_', ' ')}</option>)}</select>
      </article>)}
    </div>}
  </div>;
}
