import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const linkClass = ({ isActive }) =>
  `text-sm font-medium px-3 py-1.5 rounded-lg transition ${
    isActive ? 'bg-emerald-500 text-slate-900' : 'text-slate-300 hover:bg-slate-800'
  }`;

export default function NavBar() {
  const { user, logout } = useAuth();

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-6">
        <h1 className="text-2xl font-bold">Coinova</h1>
        <nav className="flex items-center gap-2">
          <NavLink to="/" end className={linkClass}>
            Balance
          </NavLink>
          <NavLink to="/trade" className={linkClass}>
            Trade
          </NavLink>
          <NavLink to="/account" className={linkClass}>
            Account
          </NavLink>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-slate-400 text-sm">{user?.username}</span>
        <button
          onClick={logout}
          className="bg-slate-800 hover:bg-slate-700 text-sm rounded-lg px-4 py-2 transition"
        >
          Log out
        </button>
      </div>
    </div>
  );
}