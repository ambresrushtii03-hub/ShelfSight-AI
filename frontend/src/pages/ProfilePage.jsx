import { useAuth } from '../context/AuthContext.jsx';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="max-w-xl rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h1 className="text-2xl font-bold">Profile</h1>
      <div className="mt-5 space-y-3 text-slate-700">
        <div><span className="font-semibold">Name:</span> {user?.fullName}</div>
        <div><span className="font-semibold">Email:</span> {user?.email}</div>
        <div><span className="font-semibold">Role:</span> {user?.role}</div>
      </div>
    </div>
  );
}
