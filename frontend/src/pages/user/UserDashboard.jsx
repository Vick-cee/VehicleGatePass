import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { StatusBadge } from '../../components/StatusBadge';
import { PassCard } from '../../components/PassCard';
import {
  Car,
  QrCode,
  Clock,
  CheckCircle2,
  PlusCircle,
  AlertTriangle,
  XCircle,
  ShieldAlert,
  ArrowRight,
  Printer,
  History,
  MapPin,
  ShieldCheck,
  Info,
} from 'lucide-react';

export const UserDashboard = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPassVehicle, setSelectedPassVehicle] = useState(null);

  const MAX_VEHICLES = 3;

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [vehRes, actRes] = await Promise.all([
        api.get('/vehicles/my-vehicles'),
        api.get('/scan/user-activity'),
      ]);
      setVehicles(vehRes.data.vehicles || []);
      setActivities(actRes.data.logs || []);
    } catch (err) {
      console.error('Failed to load user dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const activePassCount = vehicles.filter((v) => v.status === 'APPROVED' && v.pass?.status === 'ACTIVE').length;
  const pendingCount = vehicles.filter((v) => v.status === 'PENDING').length;
  const isLimitReached = vehicles.length >= MAX_VEHICLES;

  return (
    <div className="space-y-8 py-2">
      {/* Welcome Header */}
      <div className="bg-kasu-dark-900 rounded-3xl p-6 sm:p-8 border border-kasu-dark-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Welcome, {user?.fullName}
            </h1>
            <StatusBadge status={user?.role} size="sm" />
          </div>
          <p className="text-xs text-slate-400 flex flex-wrap items-center gap-3">
            <span>Email: <strong className="text-slate-200 font-mono">{user?.email}</strong></span>
            {user?.idNumber && <span>ID: <strong className="text-slate-200 font-mono">{user.idNumber}</strong></span>}
            {user?.department && <span>Faculty/Dept: <strong className="text-slate-200">{user.department}</strong></span>}
          </p>
        </div>

        <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
          {isLimitReached ? (
            <div className="px-4 py-2.5 rounded-xl bg-kasu-dark-950 border border-kasu-dark-700 text-slate-300 font-bold text-xs flex items-center gap-1.5">
              <Info className="w-4 h-4 text-amber-400" />
              <span>Vehicle Quota Full (3/3 Registered)</span>
            </div>
          ) : (
            <Link
              to="/vehicles/register"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-kasu-red-800 hover:bg-kasu-red-700 text-white font-bold text-xs shadow-md transition border border-kasu-red-600"
            >
              <PlusCircle className="w-4 h-4 text-kasu-green-300" />
              Register New Vehicle ({vehicles.length}/3)
            </Link>
          )}
          <span className="text-[10px] text-slate-400 font-medium">
            KASU policy limits up to 3 vehicles per user account.
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-kasu-dark-900 rounded-2xl p-5 border border-kasu-dark-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Registered Vehicles</span>
            <Car className="w-4 h-4 text-kasu-red-400" />
          </div>
          <div className="text-3xl font-black text-white">{vehicles.length} <span className="text-xs text-slate-400 font-normal">/ {MAX_VEHICLES} max</span></div>
          <div className="w-full bg-kasu-dark-950 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full ${vehicles.length >= 3 ? 'bg-amber-500' : 'bg-kasu-green-500'}`}
              style={{ width: `${(vehicles.length / MAX_VEHICLES) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-kasu-dark-900 rounded-2xl p-5 border border-kasu-dark-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Active QR Passes</span>
            <CheckCircle2 className="w-4 h-4 text-kasu-green-400" />
          </div>
          <div className="text-3xl font-black text-kasu-green-400">{activePassCount}</div>
          <div className="text-xs text-slate-400">Ready for Gate Entry & Exit</div>
        </div>

        <div className="bg-kasu-dark-900 rounded-2xl p-5 border border-kasu-dark-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Pending Approvals</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-400">{pendingCount}</div>
          <div className="text-xs text-slate-400">Under Security Review</div>
        </div>

        <div className="bg-kasu-dark-900 rounded-2xl p-5 border border-kasu-dark-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Gate Movements</span>
            <History className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-3xl font-black text-sky-400">{activities.length}</div>
          <div className="text-xs text-slate-400">Logged Entries & Exits</div>
        </div>
      </div>

      {/* Main Grid: My Vehicles + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Vehicles List (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Car className="w-5 h-5 text-kasu-red-400" />
              My Registered Vehicles ({vehicles.length}/3)
            </h2>
            <span className="text-xs text-slate-400">
              {3 - vehicles.length} slots available
            </span>
          </div>

          {loading ? (
            <div className="bg-kasu-dark-900 rounded-3xl p-12 text-center text-slate-400 border border-kasu-dark-800">
              Loading your vehicle passes...
            </div>
          ) : vehicles.length === 0 ? (
            <div className="bg-kasu-dark-900 rounded-3xl p-10 text-center border border-kasu-dark-800 space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-kasu-dark-950 text-kasu-red-400 flex items-center justify-center mx-auto border border-kasu-dark-800">
                <Car className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">No vehicles registered yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  You can register up to 3 personal or university vehicles to obtain digital gate passes.
                </p>
              </div>
              <Link
                to="/vehicles/register"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-kasu-red-800 text-white font-bold text-xs hover:bg-kasu-red-700 transition"
              >
                <PlusCircle className="w-4 h-4" /> Register Vehicle Now
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {vehicles.map((v) => (
                <div
                  key={v._id}
                  className="bg-kasu-dark-900 rounded-3xl p-6 border border-kasu-dark-800 hover:border-kasu-dark-700 transition shadow-sm space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-kasu-dark-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-kasu-dark-950 border border-kasu-dark-800 flex items-center justify-center text-slate-200 font-mono font-black text-sm">
                        <Car className="w-6 h-6 text-kasu-red-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black font-mono text-amber-400 tracking-wider">
                            {v.registrationNumber}
                          </span>
                          <StatusBadge status={v.status} size="sm" />
                        </div>
                        <div className="text-xs text-slate-300 font-medium">
                          {v.make} {v.model} &bull; {v.colour} &bull; {v.vehicleType}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      {v.pass && v.pass.status === 'ACTIVE' && (
                        <button
                          type="button"
                          onClick={() => setSelectedPassVehicle(v)}
                          className="px-3.5 py-2 rounded-xl bg-kasu-green-950 text-kasu-green-300 border border-kasu-green-800 hover:bg-kasu-green-900 font-bold text-xs flex items-center gap-1.5 transition"
                        >
                          <QrCode className="w-3.5 h-3.5" /> View Digital QR Pass
                        </button>
                      )}
                      <Link
                        to={`/pass/${v.pass?._id || v._id}`}
                        className="p-2 rounded-xl bg-kasu-dark-950 hover:bg-kasu-dark-800 text-slate-300 border border-kasu-dark-800 transition"
                        title="Pass Details"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>

                  {/* Pass Details Sub-row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-kasu-dark-950 p-3.5 rounded-2xl border border-kasu-dark-800">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Pass Status</span>
                      <span className="font-semibold text-slate-200">
                        {v.pass ? <StatusBadge status={v.pass.status} size="sm" /> : 'Not Issued'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Campus Location</span>
                      <span className="font-semibold text-slate-200">
                        <StatusBadge status={v.pass?.campusStatus || 'OUTSIDE'} size="sm" />
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Pass Expiry</span>
                      <span className="font-semibold text-slate-200">
                        {v.pass ? new Date(v.pass.expiresAt).toLocaleDateString() : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Registered On</span>
                      <span className="font-semibold text-slate-200">
                        {new Date(v.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {v.rejectionReason && (
                    <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>Rejection Reason: {v.rejectionReason}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity Sidebar (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <History className="w-5 h-5 text-kasu-green-400" />
              Recent Gate Movements
            </h2>
            <Link to="/activity" className="text-xs text-kasu-red-400 hover:underline font-bold">
              View All
            </Link>
          </div>

          <div className="bg-kasu-dark-900 rounded-3xl p-5 border border-kasu-dark-800 space-y-3 shadow-sm">
            {activities.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No gate scans recorded yet.
              </div>
            ) : (
              activities.slice(0, 5).map((act) => (
                <div
                  key={act._id}
                  className="p-3.5 rounded-2xl bg-kasu-dark-950 border border-kasu-dark-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-amber-400">
                      {act.licensePlate}
                    </span>
                    <StatusBadge status={act.direction === 'ENTRY' ? 'CHECKED_IN' : 'CHECKED_OUT'} size="sm" />
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>{act.gateId?.name || (act.direction === 'ENTRY' ? 'KASU Main Entry Gate' : 'KASU Main Exit Gate')}</span>
                    <span>{new Date(act.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Digital Pass Modal */}
      {selectedPassVehicle && selectedPassVehicle.pass && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-kasu-dark-900 border border-kasu-dark-800 rounded-3xl p-6 max-w-lg w-full space-y-6 shadow-2xl relative my-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white">Digital Vehicle Access Pass</h3>
              <button
                type="button"
                onClick={() => setSelectedPassVehicle(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white bg-kasu-dark-950 border border-kasu-dark-800"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <PassCard pass={selectedPassVehicle.pass} vehicle={selectedPassVehicle} owner={user} />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedPassVehicle(null)}
                className="px-5 py-2.5 rounded-xl bg-kasu-dark-950 text-slate-300 font-bold text-xs border border-kasu-dark-800"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2.5 rounded-xl bg-kasu-green-700 text-white font-bold text-xs flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Print / Save Badge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default UserDashboard;
