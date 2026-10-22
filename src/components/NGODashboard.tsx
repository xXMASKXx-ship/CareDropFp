import { useEffect, useState, useCallback } from 'react';
import {
  MapPin,
  CheckCircle2,
  XCircle,
  Navigation,
  Sparkles,
  Clock,
  Pill,
} from 'lucide-react';
import { supabase, type Donation } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Theme } from '@/lib/themes';
import { CATEGORIES } from '@/components/DonorDashboard';
import { reverseGeocode, type AddressResult } from '@/lib/geocoding';

export function NGODashboard({ theme }: { theme: Theme }) {
  const { session } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [addresses, setAddresses] = useState<Record<string, AddressResult | null>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel('donations-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'donations' },
        () => fetchDonations()
      )
      .subscribe();

    fetchDonations();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const fetchDonations = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('donations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching donations:', error);
      setLoading(false);
      return;
    }

    const allDonations = (data || []) as Donation[];
    const relevant = allDonations.filter(
      (d) => d.status === 'pending' || (d.status === 'accepted' && d.ngo_id === session.user.id)
    );
    setDonations(relevant);

    // Reverse geocode all pending donations
    const newAddresses: Record<string, AddressResult | null> = {};
    await Promise.all(
      relevant.map(async (don) => {
        if (don.location) {
          const result = await reverseGeocode(don.location.lat, don.location.lng);
          newAddresses[don.id] = result;
        }
      })
    );
    setAddresses(newAddresses);
    setLoading(false);
  }, [session]);

  const handleAction = async (donationId: string, action: 'accepted' | 'rejected') => {
    if (!session) return;
    try {
      const updates: Partial<Donation> = {
        status: action,
        resolved_at: new Date().toISOString(),
      };

      if (action === 'accepted') {
        updates.ngo_id = session.user.id;
        const { error: rpcError } = await supabase.rpc('increment_stats');
        if (rpcError) console.error('Stats increment failed:', rpcError);
      }

      const { error } = await supabase.from('donations').update(updates).eq('id', donationId);
      if (error) throw error;
    } catch (err) {
      console.error('Action error:', err);
    }
  };

  const getCategoryTheme = (catId: string) => {
    return CATEGORIES.find((c) => c.id === catId) || CATEGORIES[0];
  };

  const pendingDonations = donations.filter((d) => d.status === 'pending');
  const acceptedDonations = donations.filter((d) => d.status === 'accepted');

  const getPerishableUrgency = (don: Donation): 'expired' | 'critical' | 'warning' | null => {
    if (!don.perishable_expiry) return null;
    const expiry = new Date(don.perishable_expiry).getTime();
    const now = Date.now();
    const diffHours = (expiry - now) / (1000 * 60 * 60);
    if (diffHours <= 0) return 'expired';
    if (diffHours <= 6) return 'critical';
    if (diffHours <= 18) return 'warning';
    return null;
  };

  const formatPerishableTime = (don: Donation): string => {
    if (!don.perishable_expiry) return '';
    const expiry = new Date(don.perishable_expiry).getTime();
    const now = Date.now();
    const diffMs = expiry - now;
    if (diffMs <= 0) return 'Expired';
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${mins}m left`;
    return `${mins}m left`;
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Available Logistics</h2>
            <p className="text-slate-500 font-medium">Real-time surplus alerts in your zone.</p>
          </div>
          <span
            className={`${theme.bgLight} ${theme.textDark} py-1 px-3 rounded-full text-sm font-bold transition-colors`}
          >
            {pendingDonations.length} Active
          </span>
        </div>

        {loading ? (
          <div className="bg-white border border-slate-200 border-dashed rounded-3xl p-12 text-center">
            <Sparkles className={`w-10 h-10 ${theme.textPrimary} animate-pulse mx-auto mb-4`} />
            <p className="text-slate-500 font-medium">Loading donations...</p>
          </div>
        ) : pendingDonations.length === 0 ? (
          <div className="bg-white border border-slate-200 border-dashed rounded-3xl p-12 text-center flex flex-col items-center justify-center shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-700">All caught up</h3>
            <p className="text-slate-500 mt-2 max-w-md">
              There are no pending donations at the moment. We'll notify you when new surplus is listed.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingDonations.map((don) => {
              const catTheme = getCategoryTheme(don.category);
              const Icon = catTheme.icon;
              const addr = addresses[don.id];
              const urgency = getPerishableUrgency(don);
              const perishableTime = formatPerishableTime(don);

              return (
                <div
                  key={don.id}
                  className="bg-white rounded-3xl shadow-lg shadow-slate-200/40 border border-slate-100 overflow-hidden group hover:-translate-y-1 transition-transform duration-300"
                >
                  <div className={`h-2 w-full ${catTheme.bg}`}></div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-5">
                      <div className="flex items-center space-x-3">
                        <div className={`p-3 rounded-2xl ${catTheme.bg} ${catTheme.color}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-slate-900">{don.category}</h3>
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            {don.sub_category}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-slate-400 font-medium whitespace-nowrap bg-slate-50 px-2 py-1 rounded-md">
                        Just now
                      </span>
                    </div>

                    {/* Perishable urgency badge */}
                    {urgency && (
                      <div
                        className={`mb-4 p-3 rounded-xl flex items-center space-x-2 ${
                          urgency === 'expired'
                            ? 'bg-red-50 border border-red-200'
                            : urgency === 'critical'
                            ? 'bg-orange-50 border border-orange-200'
                            : 'bg-amber-50 border border-amber-200'
                        }`}
                      >
                        <Clock
                          className={`w-4 h-4 shrink-0 ${
                            urgency === 'expired'
                              ? 'text-red-500'
                              : urgency === 'critical'
                              ? 'text-orange-500'
                              : 'text-amber-500'
                          }`}
                        />
                        <span
                          className={`text-xs font-bold ${
                            urgency === 'expired'
                              ? 'text-red-700'
                              : urgency === 'critical'
                              ? 'text-orange-700'
                              : 'text-amber-700'
                          }`}
                        >
                          {urgency === 'expired'
                            ? 'Perishable item expired'
                            : `Perishable: ${perishableTime}`}
                        </span>
                      </div>
                    )}

                    <div className="space-y-3 mb-6 bg-slate-50 rounded-2xl p-4">
                      <div className="flex items-center text-sm">
                        <span className="font-bold text-slate-700 w-16">Qty:</span>
                        <span className="text-slate-900 font-medium">{don.quantity}</span>
                      </div>

                      {/* Medicine info */}
                      {don.category === 'Medicine' && don.medicine_name && (
                        <div className="flex items-start text-sm">
                          <Pill className="w-4 h-4 mr-1 mt-0.5 text-slate-400 shrink-0" />
                          <div>
                            <span className="font-bold text-slate-700">{don.medicine_name}</span>
                            {don.expiry_date && (
                              <span className="block text-xs text-slate-500 mt-0.5">
                                Expires: {new Date(don.expiry_date).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {don.description && (
                        <div className="flex items-start text-sm">
                          <span className="font-bold text-slate-700 w-16">Note:</span>
                          <span className="text-slate-600">{don.description}</span>
                        </div>
                      )}
                      {don.location && (
                        <div className="flex items-start text-sm pt-2 border-t border-slate-200/60 mt-2">
                          <MapPin className="w-4 h-4 mr-2 text-slate-400 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <span className="text-slate-700 font-medium text-sm block">
                              {addr
                                ? addr.short_address
                                : 'Resolving address...'}
                            </span>
                            {addr && addr.city && addr.country && (
                              <span className="text-slate-400 text-xs">
                                {addr.city}, {addr.country}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleAction(don.id, 'accepted')}
                        className={`flex-1 ${theme.bgPrimary} text-white py-3 rounded-xl font-bold shadow-md ${theme.shadow} transition-all opacity-90 hover:opacity-100 flex items-center justify-center space-x-2`}
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Accept</span>
                      </button>
                      <button
                        onClick={() => handleAction(don.id, 'rejected')}
                        className="flex-none px-4 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 py-3 rounded-xl font-bold transition-colors flex items-center justify-center"
                        title="Reject"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {acceptedDonations.length > 0 && (
        <section className="pt-8 border-t border-slate-200">
          <h2 className="text-xl font-extrabold text-slate-900 mb-6">In Progress / Transit</h2>
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold border-b border-slate-200">
                    <th className="px-6 py-4">Item Type</th>
                    <th className="px-6 py-4">Classification</th>
                    <th className="px-6 py-4">Quantity</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {acceptedDonations.map((don) => {
                    const catTheme = getCategoryTheme(don.category);
                    const Icon = catTheme.icon;
                    const addr = addresses[don.id];
                    return (
                      <tr key={don.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <Icon className={`w-5 h-5 ${catTheme.color}`} />
                            <div>
                              <span className="font-bold text-slate-900">{don.category}</span>
                              {don.medicine_name && (
                                <span className="block text-xs text-slate-500">{don.medicine_name}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-medium">{don.sub_category}</td>
                        <td className="px-6 py-4 text-slate-900 font-medium">{don.quantity}</td>
                        <td className="px-6 py-4">
                          {don.location ? (
                            <span className="text-slate-500 font-medium text-sm">
                              {addr ? addr.short_address : `${don.location.lat.toFixed(2)}, ${don.location.lng.toFixed(2)}`}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-sm">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${theme.bgSoft} ${theme.textPrimary} border ${theme.borderSoft}`}
                          >
                            <Navigation className="w-3 h-3 mr-1" /> En Route
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
