import { BarChart3, LogOut, Menu, Moon, Sun, User, WalletCards, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";

const links = [
  { to: "/", label: "Dashboard", icon: BarChart3 },
  { to: "/income", label: "Income", icon: WalletCards },
  { to: "/expenses", label: "Expenses", icon: WalletCards },
  { to: "/profile", label: "Profile", icon: User }
];

const Navbar = () => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem("expense_theme") === "dark");

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    localStorage.setItem("expense_theme", dark ? "dark" : "light");
  }, [dark]);

  const closeMenu = useCallback(() => setOpen(false), []);
  const toggleTheme = useCallback(() => setDark((value) => !value), []);

  const initials = useMemo(() => user?.username?.slice(0, 2).toUpperCase() || "ET", [user]);

  return (
    <header className="navbar">
      <div className="brand">
        <img className="brand-logo" src="/images/logo.png" alt="TrackMint logo" />
        <div>
          <strong>TrackMint</strong>
          <small>Welcome, {user?.username}</small>
        </div>
      </div>

      <button className="icon-button menu-button" onClick={() => setOpen((value) => !value)} aria-label="Toggle menu">
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      <nav className={`nav-links ${open ? "open" : ""}`}>
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} onClick={closeMenu} className={({ isActive }) => (isActive ? "active" : "")}>
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="nav-actions">
        <button className="icon-button" onClick={toggleTheme} aria-label="Toggle dark mode">
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        {user?.profileImage ? (
          <img className="avatar image-avatar" src={user.profileImage} alt={user.username} />
        ) : (
          <span className="avatar">{initials}</span>
        )}
        <button className="ghost-button" onClick={logout}>
          <LogOut size={17} />
          Logout
        </button>
      </div>
    </header>
  );
};

export default Navbar;
