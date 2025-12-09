"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { logoutAction } from "@/actions/auth";

interface NavBarClientProps {
  currentUser: string | null;
}

export default function NavBarClient({ currentUser }: NavBarClientProps) {
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const drawerRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
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
      // Mobile: Swipe from left edge to open
      if (
        touchStartX.current < 50 &&
        touchEndX.current - touchStartX.current > 100
      ) {
        setDrawerOpen(true);
      }
      // Mobile: Swipe left to close
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

  const MenuItems = ({ isMobile = false }: { isMobile?: boolean }) => (
    <>
      <div className="text-md font-bold">
        <button
          type="button"
          className="block w-full text-left px-4 py-2 rounded text-slate-800 hover:text-white hover:bg-slate-950"
        >
          Menu 1
        </button>
        <button
          type="button"
          className="block w-full text-left px-4 py-2 rounded text-slate-800 hover:text-white hover:bg-slate-950"
        >
          Menu 2
        </button>
        <button
          type="button"
          className="block w-full text-left px-4 py-2 rounded text-slate-800 hover:text-white hover:bg-slate-950"
        >
          Menu 3
        </button>
      </div>

      <div className="flex flex-col">
        {currentUser ? (
          // Show user info and logout when authenticated
          <>
            <span className="block text-md px-4 py-2 text-slate-800">
              Welcome, {currentUser}
            </span>
            <Link
              href="/settings/security"
              className="block text-md px-4 py-2 rounded text-slate-800 font-bold hover:text-white hover:bg-slate-950"
            >
              Security
            </Link>
            <Link
              href="/settings/account"
              className="block text-md px-4 py-2 rounded text-slate-800 font-bold hover:text-white hover:bg-slate-950"
            >
              Account
            </Link>
            <button
              onClick={handleLogout}
              data-testid={isMobile ? "logout-mobile" : "logout-desktop"}
              className="block w-full text-left text-md px-4 py-2 rounded text-slate-800 font-bold hover:text-white hover:bg-slate-950"
            >
              Logout
            </button>
          </>
        ) : (
          // Show login/register links when not authenticated
          <>
            <Link
              href="/register"
              className="block text-md px-4 py-2 rounded text-slate-800 font-bold hover:text-white hover:bg-slate-950"
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="block text-md px-4 py-2 rounded text-slate-800 font-bold hover:text-white hover:bg-slate-950"
            >
              Login
            </Link>
          </>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Drawer overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setDrawerOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setDrawerOpen(false);
          }}
          role="button"
          tabIndex={0}
          aria-label="Close menu overlay"
        />
      )}

      {/* Mobile FAB (bottom-left) */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="fixed bottom-6 left-6 z-50 lg:hidden w-14 h-14 bg-slate-600 rounded-full shadow-lg hover:bg-slate-700 active:bg-slate-800 flex items-center justify-center transition-colors"
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

      {/* Mobile drawer (left side) */}
      <div
        ref={drawerRef}
        className={`fixed top-0 left-0 h-full w-64 bg-slate-200 z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full p-6 pt-20">
          <div className="mb-8">
            <span className="font-semibold text-lg text-slate-800">Menu</span>
          </div>
          <div className="flex flex-col space-y-2 flex-grow">
            <MenuItems isMobile={true} />
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="mt-auto w-full py-3 text-slate-700 hover:text-slate-900 hover:bg-slate-300 rounded transition-colors flex items-center justify-center gap-2"
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

      {/* Desktop drawer (right side) */}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-slate-200 z-50 transform transition-transform duration-300 ease-in-out hidden lg:block ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full p-6 pt-20">
          <div className="mb-8">
            <span className="font-semibold text-lg text-slate-800">Menu</span>
          </div>
          <div className="flex flex-col space-y-2 flex-grow">
            <MenuItems isMobile={false} />
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="mt-auto w-full py-3 text-slate-700 hover:text-slate-900 hover:bg-slate-300 rounded transition-colors flex items-center justify-center gap-2"
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

      {/* Mobile: Simple header */}
      <div className="sticky top-0 z-40 lg:hidden bg-slate-500 py-2 px-2 shadow border-solid border-t-1 border-blue-900">
        <div className="flex justify-center">
          <span className="font-semibold text-base tracking-tight text-slate-200">
            Double Deuce
          </span>
        </div>
      </div>

      {/* Desktop: Navigation bar with burger menu */}
      <nav className="sticky top-0 z-40 hidden lg:flex items-center justify-between bg-slate-500 py-2 px-2 lg:px-4 shadow border-solid border-t-1 border-blue-900">
        {/* App title */}
        <div className="flex items-center flex-shrink-0">
          <span className="font-semibold text-base tracking-tight text-slate-200">
            Double Deuce
          </span>
        </div>

        {/* Burger menu button (top-right, desktop only) */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="w-10 h-10 bg-slate-600 rounded hover:bg-slate-700 active:bg-slate-800 flex items-center justify-center transition-colors"
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
      </nav>
    </>
  );
}
