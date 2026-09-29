import { useEffect, useState } from 'react';
import { Check, CircleAlert, ClipboardPlus, RefreshCw, X } from 'lucide-react';
import { auditsApi } from '../api/auditsApi.js';
import { findingsApi } from '../api/findingsApi.js';
import { tasksApi } from '../api/tasksApi.js';

const severityClass = (severity) => `severity-${String(severity || '').toLowerCase()}`;

export default function FindingsPage() {
  const [findings, setFindings] = useState([]);
  const [filter, setFilter] = useState('NEEDS_REVIEW');
  const [notes, setNotes] = useState({});
  const [createdTasks, setCreatedTasks] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [error, setError] = useState('');

  async function loadFindings() {
    setLoading(true);
    setError('');
    try {
      const { data } = await findingsApi.list(filter ? { reviewStatus: filter } : {});
      setFindings(data.findings || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load findings.');
    } finally { setLoading(false); }
  }

  useEffect(() => { loadFindings(); }, [filter]);

  async function review(findingId, reviewStatus) {
    setSavingId(findingId);
    setError('');
    try {
      await findingsApi.review(findingId, { reviewStatus, reviewerNote: notes[findingId] || '' });
      await loadFindings();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update finding.');
    } finally { setSavingId(''); }
  }

  async function createTask(finding) {
    setSavingId(finding.id);
    setError('');
    try {
      const { data } = await auditsApi.getById(finding.audit_id);
      await tasksApi.create({
        storeId: data.audit.store_id,
        auditId: finding.audit_id,
        findingId: finding.id,
        title: `${String(finding.issue_type).replaceAll('_', ' ')}: ${finding.product_name || 'Shelf issue'}`,
        description: finding.recommended_action || finding.description,
        priority: finding.severity,
      });
      setCreatedTasks((current) => new Set([...current, finding.id]));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not create a task for this finding.');
    } finally { setSavingId(''); }
  }

  return <div className="page-stack">
    <section className="page-heading"><div><p className="eyebrow">HUMAN REVIEW</p><h1>Findings</h1><p className="muted">Confirm AI observations, reject false positives, or mark issues resolved.</p></div><button className="button button-quiet" onClick={loadFindings}><RefreshCw size={16} /> Refresh</button></section>
    {error && <p className="error-banner">{error}</p>}
    <div className="filter-bar"><div className="filter-tabs" role="tablist" aria-label="Finding status">{[['NEEDS_REVIEW', 'Needs review'], ['CONFIRMED', 'Confirmed'], ['RESOLVED', 'Resolved'], ['', 'All findings']].map(([value, label]) => <button key={label} className={filter === value ? 'filter-tab active' : 'filter-tab'} onClick={() => setFilter(value)}>{label}</button>)}</div><span className="count-label">{findings.length} findings</span></div>
    {loading ? <p className="page-loading">Loading findings...</p> : findings.length === 0 ? <section className="empty-state"><CircleAlert size={26} /><h3>Nothing to review</h3><p>Findings from completed audits will show up here.</p></section> : <div className="finding-list">
      {findings.map((finding) => <article className="finding-card" key={finding.id}>
        <div className="finding-meta"><span className={severityClass(finding.severity)}>{finding.severity}</span><span>{String(finding.issue_type).replaceAll('_', ' ')}</span><span className="status-pill status-muted">{String(finding.review_status).replaceAll('_', ' ')}</span></div>
        <h2>{finding.product_name || finding.brand || 'Shelf observation'}</h2><p className="finding-description">{finding.description}</p>
        <div className="recommendation"><strong>Recommended action</strong><span>{finding.recommended_action}</span></div>
        <div className="finding-footer"><span className="confidence">AI confidence {Math.round(Number(finding.confidence) * 100)}%</span><input aria-label="Reviewer note" placeholder="Add reviewer note" value={notes[finding.id] ?? finding.reviewer_note ?? ''} onChange={(event) => setNotes({ ...notes, [finding.id]: event.target.value })} />
          <div className="finding-actions"><button className="button button-quiet" disabled={savingId === finding.id} onClick={() => createTask(finding)}><ClipboardPlus size={15} />{createdTasks.has(finding.id) ? 'Task created' : 'Create task'}</button><button className="button button-quiet" disabled={savingId === finding.id} onClick={() => review(finding.id, 'REJECTED')}><X size={15} /> Reject</button><button className="button button-primary" disabled={savingId === finding.id} onClick={() => review(finding.id, finding.review_status === 'CONFIRMED' ? 'RESOLVED' : 'CONFIRMED')}><Check size={15} />{finding.review_status === 'CONFIRMED' ? 'Mark resolved' : 'Confirm'}</button></div>
        </div>
      </article>)}
    </div>}
  </div>;
}
