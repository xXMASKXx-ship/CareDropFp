import { useState } from 'react';
import {
  Package,
  MapPin,
  AlertCircle,
  Sparkles,
  Droplet,
  Pill,
  Leaf,
  Clock,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Theme } from '@/lib/themes';
import { reverseGeocode, formatAddressForDisplay, type AddressResult } from '@/lib/geocoding';

const CATEGORIES = [
  {
    id: 'Food',
    icon: Droplet,
    color: 'text-orange-500',
    bg: 'bg-orange-100',
    activeBorder: 'border-orange-500',
    subs: ['Perishable', 'Non-Perishable'],
  },
  {
    id: 'Medicine',
    icon: Pill,
    color: 'text-blue-500',
    bg: 'bg-blue-100',
    activeBorder: 'border-blue-500',
    subs: ['Generic', 'Proprietary'],
  },
  {
    id: 'Clothing',
    icon: Leaf,
    color: 'text-pink-500',
    bg: 'bg-pink-100',
    activeBorder: 'border-pink-500',
    subs: ['Winter', 'Summer', 'General'],
  },
] as const;

type Category = (typeof CATEGORIES)[number];

const PERISHABLE_HOURS = 36; // 1.5 days

export function DonorDashboard({ theme }: { theme: Theme }) {
  const { session } = useAuth();
  const [category, setCategory] = useState<Category | null>(null);
  const [subCategory, setSubCategory] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [medicineName, setMedicineName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState<AddressResult | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isMedicine = category?.id === 'Medicine';
  const isPerishable = category?.id === 'Food' && subCategory === 'Perishable';

  const handleGetLocation = () => {
    setIsLocating(true);
    setAddress(null);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
          setLocation(coords);
          setIsLocating(false);
          // Reverse geocode the coordinates
          const result = await reverseGeocode(coords.lat, coords.lng);
          if (result) setAddress(result);
        },
        async () => {
          const fallback = { lat: 19.076, lng: 72.8777 };
          setLocation(fallback);
          setIsLocating(false);
          const result = await reverseGeocode(fallback.lat, fallback.lng);
          if (result) setAddress(result);
        }
      );
    } else {
      const fallback = { lat: 19.076, lng: 72.8777 };
      setLocation(fallback);
      setIsLocating(false);
      reverseGeocode(fallback.lat, fallback.lng).then((result) => {
        if (result) setAddress(result);
      });
    }
  };

  const validateForm = (): string | null => {
    if (!category) return 'Please select a category.';
    if (!subCategory) return 'Please select a classification.';
    if (!quantity) return 'Please enter the quantity.';
    if (!location) return 'Please record your geolocation before submitting.';

    if (isMedicine) {
      if (!medicineName.trim()) return 'Medicine name is required for medicine donations.';
      if (!expiryDate) return 'Expiry date is required for medicine donations.';
      const expiry = new Date(expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (expiry < today) return 'The expiry date has already passed. Please check the date.';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

    const validationError = validateForm();
    if (validationError) {
      setStatusMsg({ text: validationError, type: 'error' });
      setTimeout(() => setStatusMsg(null), 5000);
      return;
    }

    setIsSubmitting(true);
    try {
      // Compute perishable expiry: now + 36 hours (1.5 days)
      const perishableExpiry = isPerishable
        ? new Date(Date.now() + PERISHABLE_HOURS * 60 * 60 * 1000).toISOString()
        : null;

      const { error } = await supabase.from('donations').insert({
        category: category!.id,
        sub_category: subCategory,
        description: description || null,
        quantity,
        location,
        status: 'pending',
        medicine_name: isMedicine ? medicineName.trim() : null,
        expiry_date: isMedicine ? expiryDate : null,
        perishable_expiry: perishableExpiry,
      });

      if (error) throw error;

      setStatusMsg({
        text: isPerishable
          ? 'Success! Nearby NGOs have been alerted. Perishable item expires in 1.5 days.'
          : 'Success! Nearby NGOs have been alerted.',
        type: 'success',
      });
      setCategory(null);
      setSubCategory('');
      setDescription('');
      setQuantity('');
      setMedicineName('');
      setExpiryDate('');
      setLocation(null);
      setAddress(null);
    } catch (err) {
      console.error(err);
      setStatusMsg({ text: 'Failed to submit donation.', type: 'error' });
    }
    setIsSubmitting(false);
    setTimeout(() => setStatusMsg(null), 5000);
  };

  const step3Disabled = !category || !subCategory || !quantity || (isMedicine && (!medicineName || !expiryDate));

  return (
    <div className="max-w-3xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 text-center sm:text-left">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Post a Donation</h1>
        <p className="text-slate-500 mt-2">Your surplus can make a difference today.</p>
      </div>

      {statusMsg && (
        <div
          className={`mb-6 p-4 rounded-2xl flex items-center space-x-3 shadow-sm transition-all duration-500 ${
            statusMsg.type === 'error'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : `${theme.bgSoft} ${theme.textDark} border ${theme.borderSoft}`
          }`}
        >
          {statusMsg.type === 'error' ? (
            <AlertCircle className="w-6 h-6 shrink-0" />
          ) : (
            <Sparkles className="w-6 h-6 shrink-0" />
          )}
          <span className="font-medium">{statusMsg.text}</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
      >
        {/* Step 1: Category */}
        <div className="p-8 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
            <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm mr-3 text-slate-500">
              1
            </span>
            Select Category
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = category?.id === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setCategory(cat);
                    setSubCategory('');
                  }}
                  className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-300 ${
                    isSelected
                      ? `${cat.activeBorder} ${cat.bg} scale-105 shadow-md`
                      : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-10 h-10 mb-3 ${isSelected ? cat.color : 'text-slate-400'}`} />
                  <span className={`font-bold ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>
                    {cat.id}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Item Details */}
        <div
          className={`p-8 border-b border-slate-100 transition-opacity duration-300 ${
            !category ? 'opacity-50 pointer-events-none' : 'opacity-100'
          }`}
        >
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
            <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm mr-3 text-slate-500">
              2
            </span>
            Item Details
          </h2>

          <div className="space-y-6">
            {/* Classification */}
            {category && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Classification</label>
                <div className="flex flex-wrap gap-3">
                  {category.subs.map((sub) => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setSubCategory(sub)}
                      className={`px-5 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                        subCategory === sub
                          ? `${category.activeBorder} bg-white text-slate-900 shadow-sm`
                          : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
                {/* Perishable timing notice */}
                {isPerishable && (
                  <div className="mt-3 p-3 rounded-xl bg-orange-50 border border-orange-200 flex items-start space-x-2">
                    <Clock className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-orange-800">Perishable Item Notice</p>
                      <p className="text-xs text-orange-700 mt-0.5">
                        This donation will be marked with a 1.5-day (36-hour) expiry window from the time of
                        posting. NGOs will see an urgent timer on this donation.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Medicine-specific fields */}
            {isMedicine && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Medicine Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!category}
                    value={medicineName}
                    onChange={(e) => setMedicineName(e.target.value)}
                    placeholder="e.g., Paracetamol 500mg"
                    className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 ${theme.ring} ${theme.focusBorderActive} outline-none transition-all font-medium text-slate-900 disabled:opacity-50`}
                  />
                  <p className="text-xs text-slate-400 mt-1">Required for all medicine donations</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Expiry Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    disabled={!category}
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 ${theme.ring} ${theme.focusBorderActive} outline-none transition-all font-medium text-slate-900 disabled:opacity-50`}
                  />
                  <p className="text-xs text-slate-400 mt-1">Required for all medicine donations</p>
                </div>
              </div>
            )}

            {/* Quantity + Description */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Quantity / Amount</label>
                <input
                  type="text"
                  required
                  disabled={!category}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g., 50 boxes, 20 kg"
                  className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 ${theme.ring} ${theme.focusBorderActive} outline-none transition-all font-medium text-slate-900 disabled:opacity-50`}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  disabled={!category}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Any specific conditions?"
                  className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 ${theme.ring} ${theme.focusBorderActive} outline-none transition-all font-medium text-slate-900 disabled:opacity-50`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Dispatch */}
        <div
          className={`p-8 transition-opacity duration-300 bg-slate-50/50 ${
            step3Disabled ? 'opacity-50 pointer-events-none' : 'opacity-100'
          }`}
        >
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
            <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm mr-3 text-slate-500">
              3
            </span>
            Dispatch Setup
          </h2>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex-1 w-full bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0">
                <div className={`p-3 rounded-xl ${location ? theme.iconSoft : 'bg-slate-100 text-slate-400'}`}>
                  <MapPin className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-slate-900">
                    {location ? 'Location Secured' : 'Geolocation'}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium truncate max-w-[200px]">
                    {isLocating ? (
                      <span className="flex items-center space-x-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Resolving address...</span>
                      </span>
                    ) : location ? (
                      formatAddressForDisplay(address, location.lat, location.lng)
                    ) : (
                      'Required for optimal routing'
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={isLocating}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50 shrink-0"
              >
                {isLocating ? 'Scanning...' : location ? 'Update' : 'Record'}
              </button>
            </div>

            <button
              type="submit"
              disabled={!location || isSubmitting}
              className={`w-full sm:w-auto px-8 py-5 bg-gradient-to-r ${theme.gradientButton} ${theme.gradientHover} text-white text-lg font-bold rounded-2xl shadow-lg ${theme.shadow} transition-all ${theme.shadowLg} focus:ring-4 ${theme.ring} disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2`}
            >
              <span>{isSubmitting ? 'Processing...' : 'Submit Donation'}</span>
              {!isSubmitting && <Package className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export { CATEGORIES };
