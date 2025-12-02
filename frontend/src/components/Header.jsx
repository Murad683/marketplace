// src/components/Header.jsx
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../contexts/ThemeContext";
import NotificationBell from "./NotificationBell";

export default function Header() {
  const { isLoggedIn, isCustomer, isMerchant } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="navbar-shell transition-colors">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between px-6 py-4">
        {/* Left: Logo / Home link */}
        <Link
          to="/"
          className="navbar-brand text-lg font-semibold transition-colors"
        >
          Marketplace
        </Link>

        {/* Right: Nav */}
        <nav className="flex flex-wrap items-center gap-5 text-sm font-medium">
          {!isLoggedIn && (
            <>
              <Link
                to="/login"
                className="navbar-link transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="navbar-link transition-colors"
              >
                Register
              </Link>
            </>
          )}

          {isCustomer && (
            <>
              <Link
                to="/wishlist"
                className="navbar-link transition-colors"
              >
                Wishlist
              </Link>
              <Link
                to="/cart"
                className="navbar-link transition-colors"
              >
                Cart
              </Link>
              <Link
                to="/orders"
                className="navbar-link transition-colors"
              >
                My Orders
              </Link>
            </>
          )}

          {isMerchant && (
            <>
              <Link
                to="/merchant/create-product"
                className="navbar-link transition-colors"
              >
                Create Product
              </Link>
              <Link
                to="/merchant/orders"
                className="navbar-link transition-colors"
              >
                Orders
              </Link>
            </>
          )}

          {isLoggedIn && (
            <NotificationBell />
          )}

          {isCustomer && (
            <Link
              to="/profile"
              className="navbar-link profile-avatar transition-colors"
              title="Profile"
            >
              <span aria-hidden>👤</span>
              <span className="sr-only">Profile</span>
            </Link>
          )}

          {isMerchant && (
            <Link
              to="/merchant/profile"
              className="navbar-link profile-avatar transition-colors"
              title="Profile"
            >
              <span aria-hidden>👤</span>
              <span className="sr-only">Profile</span>
            </Link>
          )}

          {/* THEME TOGGLE BUTTON */}
          <button
            onClick={toggleTheme}
            className="ml-3 btn btn-secondary text-xs font-semibold transition-colors"
          >
            {isDark ? "Light mode ☀" : "Dark mode 🌙"}
          </button>
        </nav>
      </div>
    </header>
  );
}
