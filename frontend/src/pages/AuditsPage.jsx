import { useEffect, useState } from 'react';
import { Activity, ArrowUpRight, ImagePlus, Play, RefreshCw } from 'lucide-react';
import { auditsApi } from '../api/auditsApi.js';
import { shelvesApi } from '../api/shelvesApi.js';
import { storesApi } from '../api/storesApi.js';
import SearchableSelect from '../components/forms/SearchableSelect.jsx';

const dateLabel = (value) => value ? new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Not available';

export default function AuditsPage() {
  const [audits, setAudits] = useState([]);
  const [stores, setStores] = useState([]);
  const [shelves, setShelves] = useState([]);
  const [storeId, setStoreId] = useState('');
  const [shelfId, setShelfId] = useState('');
  const [image, setImage] = useState(null);
  const [auditNotes, setAuditNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [activeId, setActiveId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function loadAudits() {
    setLoading(true);
    try {
      const [auditResponse, storeResponse] = await Promise.all([auditsApi.list({ limit: 50 }), storesApi.list({ page: 1, limit: 100 })]);
      setAudits(auditResponse.data.audits || []);
      setStores(storeResponse.data.stores || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load audits.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAudits(); }, []);
  useEffect(() => {
    if (!storeId) { setShelves([]); setShelfId(''); return; }
    setShelves([]);
    setShelfId('');
    shelvesApi.list(storeId).then(({ data }) => {
      const nextShelves = data.shelves || [];
      setShelves(nextShelves);
    }).catch((requestError) => setError(requestError.response?.data?.message || 'Could not load shelves.'));
  }, [storeId]);

  async function handleUpload(event) {
    event.preventDefault();
    if (!image || !storeId || !shelfId) return;
    setWorking(true);
    setError('');
    setNotice('Uploading image...');
    try {
      const { data } = await auditsApi.create({ image, storeId, shelfId, auditNotes });
      setActiveId(data.audit.id);
      setNotice('Image uploaded. Starting visual analysis...');
      await auditsApi.analyze(data.audit.id);
      setNotice('Analysis complete.');
      setImage(null);
      setAuditNotes('');
      event.target.reset();
      await loadAudits();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Audit could not be completed. You can retry analysis from the audit list.');
      await loadAudits();
    } finally {
      setWorking(false);
      setActiveId('');
    }
  }

  async function analyzeAgain(auditId) {
    setWorking(true);
    setActiveId(auditId);
    setError('');
    setNotice('Analysis in progress...');
    try {
      await auditsApi.analyze(auditId);
      setNotice('Analysis complete.');
      await loadAudits();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Analysis failed.');
      await loadAudits();
    } finally {
      setWorking(false);
      setActiveId('');
    }
  }

  return <div className="page-stack">
    <section className="page-heading"><div><p className="eyebrow">VISUAL INTELLIGENCE</p><h1>Shelf audits</h1><p className="muted">Capture a shelf image and turn visible issues into actionable findings.</p></div><button className="button button-quiet" onClick={loadAudits}><RefreshCw size={16} /> Refresh</button></section>
    {error && <p className="error-banner">{error}</p>}{notice && !error && <p className="notice-banner">{notice}</p>}
    <section className="upload-layout">
      <form className="surface upload-form" onSubmit={handleUpload}>
        <div className="section-title"><div className="row-icon accent-icon"><ImagePlus size={19} /></div><div><h2>New image audit</h2><p>Choose a store, shelf, and clear shelf photo.</p></div></div>
        <label>Store<SearchableSelect label="Store" options={stores.map((store) => ({ value: store.id, label: `${store.name} · ${store.city}` }))} value={storeId} onChange={setStoreId} placeholder="Choose or type a store" /></label>
        <label>Shelf<SearchableSelect label="Shelf" options={shelves.map((shelf) => ({ value: shelf.id, label: `${shelf.name} · ${shelf.category}` }))} value={shelfId} onChange={setShelfId} placeholder={storeId ? 'Choose or type a shelf' : 'Select a store first'} disabled={!storeId} /></label>
        <label className="file-picker"><span><ImagePlus size={20} />{image ? image.name : 'Choose shelf image'}</span><input required type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setImage(event.target.files?.[0] || null)} /></label>
        <label>Auditor notes <span className="optional-label">Optional</span><textarea rows="3" value={auditNotes} onChange={(event) => setAuditNotes(event.target.value)} placeholder="Anything the analysis should consider?" /></label>
        <button className="button button-primary submit-button" disabled={working || !stores.length || !shelves.length}><Play size={16} />{working ? 'Analyzing...' : 'Upload and analyze'}</button>
        {!stores.length && !loading && <p className="field-hint">Create a store and shelf before starting an audit.</p>}
      </form>
      <section className="audit-list-panel"><div className="section-heading"><div><p className="eyebrow">HISTORY</p><h2>Recent audits</h2></div><span className="count-label">{audits.length}</span></div>
        {loading ? <p className="page-loading">Loading audits...</p> : audits.length === 0 ? <div className="empty-state compact"><Activity size={25} /><h3>No audits yet</h3><p>Your submitted shelf checks will appear here.</p></div> : <div className="data-list">
          {audits.map((audit) => <article className="audit-row" key={audit.id}>
            <div className="audit-score">{audit.overall_score == null ? '—' : Math.round(Number(audit.overall_score))}</div>
            <div className="row-main"><div className="audit-row-title"><h3>{audit.image_original_name || 'Shelf photo'}</h3><span className={`status-pill status-${String(audit.status).toLowerCase()}`}>{audit.status}</span></div><p>{dateLabel(audit.created_at)}{audit.ai_summary ? ` · ${audit.ai_summary}` : audit.processing_error ? ` · ${audit.processing_error}` : ''}</p></div>
            {(audit.status === 'UPLOADED' || audit.status === 'FAILED') && <button className="icon-button" title="Analyze image" disabled={working} onClick={() => analyzeAgain(audit.id)}>{activeId === audit.id ? <RefreshCw size={17} className="spin" /> : <ArrowUpRight size={17} />}</button>}
          </article>)}
        </div>}
      </section>
    </section>
  </div>;
}
