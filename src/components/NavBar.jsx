import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const desktopLinkClass = ({ isActive }) =>
  `text-sm font-medium px-3 py-1.5 rounded-lg transition ${
    isActive ? 'bg-emerald-500 text-slate-900' : 'text-slate-300 hover:bg-slate-800'
  }`;

const mobileLinkClass = ({ isActive }) =>
  `flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-xs font-medium transition ${
    isActive ? 'text-emerald-400' : 'text-slate-400'
  }`;

function BalanceIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
      <path d="M7 14h4" />
    </svg>
  );
}

function TradeIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M14 7h7v7" />
    </svg>
  );
}

function StakingIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M12 2v20" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function AccountIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" />
    </svg>
  );
}

const NAV_ITEMS = [
  { to: '/', end: true, label: 'Balance', icon: BalanceIcon },
  { to: '/trade', end: false, label: 'Trade', icon: TradeIcon },
  { to: '/staking', end: false, label: 'Staking', icon: StakingIcon },
  { to: '/account', end: false, label: 'Account', icon: AccountIcon },
];

export default function NavBar() {
  const { user, logout } = useAuth();

  return (
    <>
      {/* Desktop: full nav in the top bar. Mobile: just branding + logout, links move to the bottom tab bar below. */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-bold">Coinova</h1>
          <nav className="hidden sm:flex items-center gap-2">
            {NAV_ITEMS.map(({ to, end, label }) => (
              <NavLink key={to} to={to} end={end} className={desktopLinkClass}>
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-400 text-sm hidden sm:inline">{user?.username}</span>
          <button
            onClick={logout}
            className="bg-slate-800 hover:bg-slate-700 text-sm rounded-lg px-4 py-2 transition"
          >
            Log out
          </button>
        </div>
      </div>

      {/* Mobile only: sticky bottom tab bar, stays fixed while scrolling. */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-50 bg-slate-800 border-t border-slate-700/50 flex items-stretch pb-[env(safe-area-inset-bottom)]">
        {NAV_ITEMS.map(({ to, end, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={end} className={mobileLinkClass}>
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}