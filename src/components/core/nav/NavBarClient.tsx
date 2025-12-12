"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { logoutAction } from "@/actions/auth";

interface NavBarClientProps {
  currentUser: string | null;
}

export default function NavBarClient({ currentUser }: NavBarClientProps) {
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [userMenuOpen, setUserMenuOpen] = useState<boolean>(false);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const drawerRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userMenuButtonRef = useRef<HTMLButtonElement>(null);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logoutAction();
  };

  // Handle swipe gestures
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: TouchEvent) => {
      touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
      // Swipe from left edge (within 50px) to open
      if (
        touchStartX.current < 50 &&
        touchEndX.current - touchStartX.current > 100
      ) {
        setDrawerOpen(true);
      }
      // Swipe left to close
      if (drawerOpen && touchStartX.current - touchEndX.current > 100) {
        setDrawerOpen(false);
      }
    };

    document.addEventListener("touchstart", handleTouchStart);
    document.addEventListener("touchmove", handleTouchMove);
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [drawerOpen]);

  // Close drawer when clicking outside
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleClickOutside = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setDrawerOpen(false);
      }
    };

    if (drawerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [drawerOpen]);

  // Close user menu when clicking outside or pressing Escape
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!userMenuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(target) &&
        userMenuButtonRef.current &&
        !userMenuButtonRef.current.contains(target)
      ) {
        setUserMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [userMenuOpen]);

  const MenuItems = ({ isMobile = false }: { isMobile?: boolean }) => {
    const renderAuthenticatedLinks = () => {
      if (!currentUser || !isMobile) return null;

      return (
        <div className="flex flex-col space-y-3 w-full text-slate-800">
          <span
            className="block text-md px-4 py-2 mt-1"
            data-testid="nav-welcome"
          >
            Welcome, {currentUser}
          </span>
          <Link
            href="/settings/security"
            data-testid="nav-link-security-mobile"
            className="block w-full text-left text-md px-4 py-2 rounded font-bold hover:bg-slate-300"
            onClick={() => setDrawerOpen(false)}
          >
            Security
          </Link>
          <Link
            href="/settings/account"
            data-testid="nav-link-account"
            className="block w-full text-left text-md px-4 py-2 rounded font-bold hover:bg-slate-300"
            onClick={() => setDrawerOpen(false)}
          >
            Account
          </Link>
          <button
            onClick={handleLogout}
            data-testid={isMobile ? "logout-mobile" : "logout-desktop"}
            className="block w-full text-left text-md px-4 py-2 rounded font-bold hover:bg-slate-300"
          >
            Logout
          </button>
        </div>
      );
    };

    const renderUnauthenticatedLinks = () => {
      if (currentUser || !isMobile) return null;

      return (
        <div className="flex flex-col space-y-3 w-full mt-2">
          <Link
            href="/register"
            className="block w-full text-left text-md px-4 py-2 rounded text-slate-200 font-bold hover:bg-slate-950"
            onClick={() => setDrawerOpen(false)}
          >
            Sign in
          </Link>
          <Link
            href="/login"
            className="block w-full text-left text-md px-4 py-2 rounded text-slate-200 font-bold hover:bg-slate-950"
            onClick={() => setDrawerOpen(false)}
          >
            Login
          </Link>
        </div>
      );
    };

    return (
      <div
        className={
          isMobile
            ? "flex flex-col space-y-3 w-full"
            : "flex items-center w-full"
        }
      >
        {renderAuthenticatedLinks()}
        {renderUnauthenticatedLinks()}
      </div>
    );
  };

  return (
    <>
      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          data-testid="nav-overlay"
          onClick={() => setDrawerOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setDrawerOpen(false);
          }}
          role="button"
          tabIndex={0}
          aria-label="Close menu overlay"
        />
      )}

      {/* Floating Action Button - Mobile only */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="fixed bottom-6 left-6 z-50 lg:hidden w-14 h-14 bg-slate-600 rounded-full shadow-lg hover:bg-slate-700 active:bg-slate-800 flex items-center justify-center transition-colors"
        data-testid="nav-open-fab"
        aria-label="Open Menu"
      >
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Mobile drawer */}
      <div
        ref={drawerRef}
        className={`fixed top-0 left-0 h-full w-64 bg-slate-200 z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        } overflow-hidden`}
        data-testid="nav-drawer"
      >
        <div className="flex flex-col h-full p-6 pt-20">
          <div className="mb-8">
            <span className="font-semibold text-lg text-slate-800">Menu</span>
          </div>
          <div className="flex flex-col space-y-3 flex-grow items-start">
            <MenuItems isMobile={true} />
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="mt-auto w-full py-3 text-slate-700 hover:text-slate-900 hover:bg-slate-300 rounded transition-colors flex items-center justify-center gap-2"
            data-testid="nav-close"
            aria-label="Close Menu"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            <span>Close</span>
          </button>
        </div>
      </div>

      {/* Desktop and mobile top bar */}
      <nav className="sticky top-0 z-50 flex items-center justify-between flex-wrap bg-slate-500 py-0 pt-[1px] lg:py-1 lg:px-12 shadow border-solid border-t-1 border-blue-900">
        {/* Mobile: Only show title */}
        <div className="flex justify-center w-full lg:hidden py-2">
          <span className="font-semibold text-base tracking-tight text-slate-200">
            Deal Decoder
          </span>
        </div>

        {/* Desktop: Full navigation */}
        <div className="hidden lg:flex justify-between w-full items-center">
          <div className="flex items-center flex-shrink-0 text-gray-800 mr-16">
            <span className="font-semibold text-base tracking-tight text-slate-200">
              Deal Decoder
            </span>
          </div>

          <div className="menu flex-grow flex items-center px-3">
            <MenuItems isMobile={false} />
          </div>

          {currentUser && (
            <div className="relative ml-4">
              <button
                ref={userMenuButtonRef}
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-slate-600 text-slate-100 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300"
                data-testid="nav-user-menu-trigger"
                aria-label="Open user menu"
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>

              {userMenuOpen && (
                <div
                  ref={userMenuRef}
                  data-testid="nav-user-menu"
                  className="absolute right-0 mt-2 w-56 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-50"
                  role="menu"
                >
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm text-slate-500">Signed in</p>
                    <p
                      className="text-sm font-medium text-slate-800 truncate"
                      data-testid="nav-welcome"
                    >
                      Welcome, {currentUser}
                    </p>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/settings/security"
                      data-testid="nav-link-security-desktop"
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                      role="menuitem"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Security
                    </Link>
                    <Link
                      href="/settings/account"
                      data-testid="nav-link-account"
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                      role="menuitem"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Account
                    </Link>
                    <button
                      onClick={handleLogout}
                      data-testid="logout-desktop"
                      className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                      role="menuitem"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
