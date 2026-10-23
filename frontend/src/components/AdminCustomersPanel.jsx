import React, { useEffect, useState } from 'react';
import { Search, Users } from 'lucide-react';
import { authAPI } from '../services/api';

export default function AdminCustomersPanel() {
  const [customers, setCustomers] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isCurrentRequest = true;
    setLoading(true);
    setError('');

    authAPI.getAdminCustomers({ page, limit: 25, search })
      .then((response) => {
        if (!isCurrentRequest) return;
        setCustomers(response.customers || []);
        setPagination(response.pagination || { page: 1, total: 0, totalPages: 0 });
      })
      .catch((requestError) => {
        if (!isCurrentRequest) return;
        setError(requestError.message || 'Failed to load customer records.');
      })
      .finally(() => {
        if (isCurrentRequest) setLoading(false);
      });

    return () => { isCurrentRequest = false; };
  }, [page, search]);

  return (
    <section className="space-y-4" aria-label="Customer relationship management">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          setSearch(searchInput.trim());
        }}
        className="flex flex-col sm:flex-row gap-3 items-center justify-between"
      >
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search guests by name, email, or phone"
            className="w-full bg-white/5 border border-white/15 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-hotel-gold"
          />
        </div>
        <button
          type="submit"
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-hotel-gold text-hotel-emerald-dark text-xs font-bold uppercase tracking-wider"
        >
          Search guests
        </button>
      </form>

      {loading ? (
        <div className="py-12 text-center text-xs text-gray-400">Loading customer records...</div>
      ) : error ? (
        <div role="alert" className="py-12 text-center text-xs text-red-300">{error}</div>
      ) : customers.length === 0 ? (
        <div className="py-12 text-center text-xs text-gray-400">No registered customers found.</div>
      ) : (
        <div className="space-y-3">
          {customers.map((customer) => (
            <article
              key={customer._id}
              className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                {customer.avatar ? (
                  <img src={customer.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-hotel-gold/15 text-hotel-gold flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-white truncate">{customer.name}</h3>
                  <a href={`mailto:${customer.email}`} className="text-xs text-gray-300 hover:text-hotel-gold break-all">
                    {customer.email}
                  </a>
                  {customer.phone && (
                    <a href={`tel:${customer.phone}`} className="block text-xs text-gray-400 hover:text-hotel-gold">
                      {customer.phone}
                    </a>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wide">
                <span className={`px-2.5 py-1 rounded-full border ${
                  customer.emailVerified
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                }`}>
                  {customer.emailVerified ? 'Email verified' : 'Unverified'}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300">
                  {customer.authProvider === 'google' ? 'Google' : 'Email'}
                </span>
                {customer.membership?.isActive && (
                  <span className="px-2.5 py-1 rounded-full bg-hotel-gold/10 border border-hotel-gold/30 text-hotel-gold">
                    {customer.membership.tier} member
                  </span>
                )}
                <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300">
                  {customer.bookingCount} {customer.bookingCount === 1 ? 'booking' : 'bookings'}
                </span>
                {!customer.isActive && (
                  <span className="px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-300">
                    Inactive
                  </span>
                )}
                <span className="text-gray-500 normal-case">
                  Joined {new Date(customer.createdAt).toLocaleDateString()}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-white/10 pt-4 text-xs text-gray-400">
        <span>{pagination.total} registered customers</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
            disabled={page <= 1 || loading}
            className="px-3 py-1.5 rounded-lg border border-white/15 disabled:opacity-40"
          >
            Previous
          </button>
          <span>Page {page} of {Math.max(1, pagination.totalPages)}</span>
          <button
            type="button"
            onClick={() => setPage((currentPage) => currentPage + 1)}
            disabled={page >= pagination.totalPages || loading}
            className="px-3 py-1.5 rounded-lg border border-white/15 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
