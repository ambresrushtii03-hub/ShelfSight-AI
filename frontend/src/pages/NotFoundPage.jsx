import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
        <h1 className="text-4xl font-bold text-slate-900">404</h1>
        <p className="mt-3 text-slate-600">This page could not be found.</p>
        <Link to="/" className="mt-5 inline-block rounded-xl bg-blue-600 px-4 py-2 font-medium text-white">Return home</Link>
      </div>
    </div>
  );
}
