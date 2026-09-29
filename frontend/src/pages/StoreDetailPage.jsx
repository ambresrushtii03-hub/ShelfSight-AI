import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Rows3 } from 'lucide-react';
import { storesApi } from '../api/storesApi.js';
import { shelvesApi } from '../api/shelvesApi.js';

const initialShelf = { name: '', category: '', aisleCode: '', description: '', expectedProducts: '' };

export default function StoreDetailPage() {
  const { storeId } = useParams();
  const [store, setStore] = useState(null);
  const [shelves, setShelves] = useState([]);
  const [form, setForm] = useState(initialShelf);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function loadStore() {
    setLoading(true);
    setError('');
    try {
      const [storeResponse, shelfResponse] = await Promise.all([storesApi.getById(storeId), shelvesApi.list(storeId)]);
      setStore(storeResponse.data.store);
      setShelves(shelfResponse.data.shelves || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load this store.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadStore(); }, [storeId]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await shelvesApi.create(storeId, form);
      setForm(initialShelf);
      setShowForm(false);
      await loadStore();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not create shelf.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="page-loading">Loading store...</p>;
  if (!store) return <section className="surface"><p className="error-text">{error || 'Store not found.'}</p><Link className="text-link" to="/stores">Back to stores</Link></section>;

  return (
    <div className="page-stack">
      <Link to="/stores" className="back-link"><ArrowLeft size={16} /> All stores</Link>
      <section className="page-heading">
        <div>
          <p className="eyebrow">STORE DIRECTORY</p>
          <h1>{store.name}</h1>
          <p className="muted">{[store.address_line_1, store.city, store.state_region, store.country].filter(Boolean).join(', ')}</p>
        </div>
        <span className={`status-pill ${store.status === 'ACTIVE' ? 'status-good' : 'status-muted'}`}>{store.status}</span>
      </section>
      {error && <p className="error-banner">{error}</p>}
      <section className="section-heading">
        <div><p className="eyebrow">LAYOUT</p><h2>Shelves <span className="count-label">{shelves.length}</span></h2></div>
        <button className="button button-primary" onClick={() => setShowForm((value) => !value)}><Plus size={17} /> Add shelf</button>
      </section>
      {showForm && <form className="surface form-grid" onSubmit={handleSubmit}>
        <label>Shelf name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Breakfast cereal" /></label>
        <label>Category<input required value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="e.g. Grocery" /></label>
        <label>Aisle code<input value={form.aisleCode} onChange={(event) => setForm({ ...form, aisleCode: event.target.value })} placeholder="A-04" /></label>
        <label className="span-all">Expected products / planogram notes<textarea rows="2" value={form.expectedProducts} onChange={(event) => setForm({ ...form, expectedProducts: event.target.value })} /></label>
        <label className="span-all">Description<textarea rows="2" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
        <div className="form-actions span-all"><button type="button" className="button button-quiet" onClick={() => setShowForm(false)}>Cancel</button><button className="button button-primary" disabled={saving}>{saving ? 'Saving...' : 'Create shelf'}</button></div>
      </form>}
      {shelves.length === 0 ? <section className="empty-state"><Rows3 size={26} /><h3>No shelves configured</h3><p>Add shelves to make them available for image audits.</p></section> : <div className="data-list">
        {shelves.map((shelf) => <article className="list-row" key={shelf.id}>
          <div className="row-icon"><Rows3 size={18} /></div><div className="row-main"><h3>{shelf.name}</h3><p>{shelf.category}{shelf.aisle_code ? ` · Aisle ${shelf.aisle_code}` : ''}</p></div>
          {shelf.expected_products && <span className="row-note">Planogram notes added</span>}
        </article>)}
      </div>}
    </div>
  );
}
