import { useEffect, useState } from 'react';
import { Activity, AlertTriangle, ArrowUpRight, ClipboardList, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { analyticsApi } from '../api/analyticsApi.js';
import { auditsApi } from '../api/auditsApi.js';

const summaryValue = (summary, camelKey, lowerKey) => Number(summary?.[camelKey] ?? summary?.[lowerKey] ?? 0);

export default function DashboardPage() {
  const [summary, setSummary] = useState({});
  const [trend, setTrend] = useState([]);
  const [recent, setRecent] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([analyticsApi.summary(), analyticsApi.auditTrend(14), auditsApi.list({ limit: 5 })])
      .then(([summaryResponse, trendResponse, auditResponse]) => {
        setSummary(summaryResponse.data.summary || {});
        setTrend((trendResponse.data.data || []).slice().reverse().map((item) => ({ ...item, day: new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) })));
        setRecent(auditResponse.data.audits || []);
      })
      .catch((requestError) => setError(requestError.response?.data?.message || 'Dashboard data is unavailable.'))
      .finally(() => setLoading(false));
  }, []);

  const metrics = [
    { title: 'Audits completed', value: summaryValue(summary, 'totalAudits', 'totalaudits'), note: 'Across your organization', icon: Activity, color: 'green' },
    { title: 'Average compliance', value: `${Math.round(summaryValue(summary, 'averageCompliance', 'averagecompliance'))}%`, note: 'Overall shelf score', icon: ShieldCheck, color: 'blue' },
    { title: 'Open tasks', value: summaryValue(summary, 'openTasks', 'opentasks'), note: 'Awaiting store action', icon: ClipboardList, color: 'orange' },
    { title: 'High-risk findings', value: summaryValue(summary, 'highPriorityIssues', 'highpriorityissues'), note: 'High and critical severity', icon: AlertTriangle, color: 'red' },
  ];

  return <div className="page-stack">
    <section className="page-heading dashboard-heading"><div><p className="eyebrow">OPERATIONS OVERVIEW</p><h1>Good work starts on the shelf.</h1><p className="muted">A live view of audit quality and the actions still in motion.</p></div><Link to="/audits" className="button button-primary"><Activity size={17} /> New audit</Link></section>
    {error && <p className="error-banner">{error}</p>}
    <section className="metric-grid">{metrics.map(({ title, value, note, icon: Icon, color }) => <article className="metric-card" key={title}><div className={`metric-icon metric-${color}`}><Icon size={19} /></div><p>{title}</p><strong>{loading ? '—' : value}</strong><small>{note}</small></article>)}</section>
    <section className="dashboard-panels"><article className="surface chart-panel"><div className="section-heading"><div><p className="eyebrow">LAST 14 DAYS</p><h2>Audit activity</h2></div><Link to="/audits" className="text-link">Audit history <ArrowUpRight size={15} /></Link></div>
      <div className="chart-wrap">{trend.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={trend} margin={{ top: 12, right: 6, left: -20, bottom: 0 }}><CartesianGrid stroke="#e8ece8" vertical={false} /><XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: '#7b8780', fontSize: 11 }} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#7b8780', fontSize: 11 }} /><Tooltip cursor={{ fill: '#f1f5f0' }} contentStyle={{ border: '1px solid #e0e6e0', borderRadius: 8, fontSize: 12 }} /><Bar dataKey="audits" fill="#2c7657" radius={[4, 4, 0, 0]} maxBarSize={34} /></BarChart></ResponsiveContainer> : <div className="chart-empty">{loading ? 'Loading activity...' : 'Audit activity will appear here.'}</div>}</div>
    </article><article className="surface recent-panel"><div className="section-heading"><div><p className="eyebrow">LATEST CHECKS</p><h2>Recent audits</h2></div><Link to="/audits" className="icon-button" title="View all audits"><ArrowUpRight size={17} /></Link></div>
      {loading ? <p className="page-loading">Loading recent audits...</p> : recent.length === 0 ? <div className="empty-inline"><Activity size={20} /><span>No audits yet. Start with a shelf photo.</span></div> : <div className="recent-list">{recent.map((audit) => <div className="recent-item" key={audit.id}><span className="recent-score">{audit.overall_score == null ? '—' : Math.round(Number(audit.overall_score))}</span><span className="recent-copy"><strong>{audit.image_original_name || 'Shelf image'}</strong><small>{new Date(audit.created_at).toLocaleDateString()} · {audit.status}</small></span></div>)}</div>}
    </article></section>
  </div>;
}
