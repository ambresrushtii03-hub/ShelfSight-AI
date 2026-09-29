import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, MapPin, Plus, Search, Store as StoreIcon, X } from 'lucide-react';
import { storesApi } from '../api/storesApi.js';

const emptyStore = { name: '', addressLine1: '', city: '', stateRegion: '', country: '', postalCode: '' };

export default function StoresPage() {
  const [stores, setStores] = useState([]);
  const [form, setForm] = useState(emptyStore);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function loadStores(query = search) {
    setLoading(true);
    setError('');
    try {
      const { data } = await storesApi.list({ page: 1, limit: 100, ...(query ? { search: query } : {}) });
      setStores(data.stores || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load stores.');
    } finally { setLoading(false); }
  }

  useEffect(() => { loadStores(''); }, []);

  async function createStore(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await storesApi.create(form);
      setForm(emptyStore);
      setShowForm(false);
      await loadStores();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not create store.');
    } finally { setSaving(false); }
  }

  return <div className="page-stack">
    <section className="page-heading"><div><p className="eyebrow">LOCATION MANAGEMENT</p><h1>Stores</h1><p className="muted">Manage the locations and shelf layouts your team audits.</p></div><button className="button button-primary" onClick={() => setShowForm(true)}><Plus size={17} /> Add store</button></section>
    {error && <p className="error-banner">{error}</p>}
    <section className="directory-toolbar"><div className="search-control"><Search size={17} /><input aria-label="Search stores" value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && loadStores(search)} placeholder="Search by name or city" /></div><span className="count-label">{stores.length} locations</span></section>
    {loading ? <p className="page-loading">Loading stores...</p> : stores.length === 0 ? <section className="empty-state"><StoreIcon size={28} /><h3>{search ? 'No matching stores' : 'No stores yet'}</h3><p>{search ? 'Try another name or city.' : 'Add your first location to start building a shelf audit program.'}</p><button className="button button-primary" onClick={() => setShowForm(true)}><Plus size={17} /> Add store</button></section> : <div className="store-grid">
      {stores.map((store, index) => <Link key={store.id} to={`/stores/${store.id}`} className="store-card" style={{ animationDelay: `${index * 45}ms` }}>
        <div className="store-card-top"><span className="store-card-icon"><StoreIcon size={20} /></span><span className={`status-pill ${store.status === 'ACTIVE' ? 'status-good' : 'status-muted'}`}>{store.status}</span></div>
        <h2>{store.name}</h2><p className="store-location"><MapPin size={15} />{[store.city, store.state_region, store.country].filter(Boolean).join(', ')}</p>
        <div className="store-card-foot"><span>{store.address_line_1}</span><ArrowUpRight size={17} /></div>
      </Link>)}
    </div>}
    {showForm && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setShowForm(false)}><section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="create-store-title">
      <div className="modal-heading"><div><p className="eyebrow">NEW LOCATION</p><h2 id="create-store-title">Add a store</h2></div><button className="icon-button" onClick={() => setShowForm(false)} aria-label="Close"><X size={19} /></button></div>
      <form className="form-grid" onSubmit={createStore}><label className="span-all">Store name<input required minLength="2" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label className="span-all">Address<input required value={form.addressLine1} onChange={(event) => setForm({ ...form, addressLine1: event.target.value })} /></label><label>City<input required value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} /></label><label>State / region<input value={form.stateRegion} onChange={(event) => setForm({ ...form, stateRegion: event.target.value })} /></label><label>Country<input required value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} /></label><label>Postal code<input value={form.postalCode} onChange={(event) => setForm({ ...form, postalCode: event.target.value })} /></label>
        <div className="form-actions span-all"><button type="button" className="button button-quiet" onClick={() => setShowForm(false)}>Cancel</button><button className="button button-primary" disabled={saving}>{saving ? 'Creating...' : 'Create store'}</button></div>
      </form>
    </section></div>}
  </div>;
}
