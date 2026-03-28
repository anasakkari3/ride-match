import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/permissions';
import { getFunnelMetrics, getDailyTripsAndBookings } from '@/lib/services/admin';

export default async function AdminAnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  // Check admin role via helper
  const isUserAdmin = await isAdmin(user.id);
  if (!isUserAdmin) redirect('/app');

  const [funnel, daily] = await Promise.all([
    getFunnelMetrics(),
    getDailyTripsAndBookings(),
  ]);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Admin Analytics</h1>

      <section className="mb-8">
        <h2 className="text-lg font-medium text-slate-800 mb-3">Funnel events</h2>
        <div className="overflow-x-auto">
          <table className="w-full border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-100">
              <tr>
                <th className="text-left px-4 py-2 text-slate-700">Event</th>
                <th className="text-right px-4 py-2 text-slate-700">Count</th>
              </tr>
            </thead>
            <tbody>
              {funnel.map((row) => (
                <tr key={row.event_name} className="border-t border-slate-200">
                  <td className="px-4 py-2 text-slate-900">{row.event_name}</td>
                  <td className="px-4 py-2 text-right text-slate-700">{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium text-slate-800 mb-3">Daily trips and bookings by community</h2>
        <div className="overflow-x-auto">
          <table className="w-full border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-100">
              <tr>
                <th className="text-left px-4 py-2 text-slate-700">Date</th>
                <th className="text-left px-4 py-2 text-slate-700">Community</th>
                <th className="text-right px-4 py-2 text-slate-700">Trips</th>
                <th className="text-right px-4 py-2 text-slate-700">Bookings</th>
              </tr>
            </thead>
            <tbody>
              {daily.map((row) => (
                <tr key={`${row.date}-${row.community_id}`} className="border-t border-slate-200">
                  <td className="px-4 py-2 text-slate-900">{row.date}</td>
                  <td className="px-4 py-2 text-slate-900">{row.community_name ?? row.community_id}</td>
                  <td className="px-4 py-2 text-right text-slate-700">{row.trips}</td>
                  <td className="px-4 py-2 text-right text-slate-700">{row.bookings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
