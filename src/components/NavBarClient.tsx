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

  const MenuItems = ({ isMobile = false }: { isMobile?: boolean }) => (
    <>
      <div className="text-md font-bold lg:flex-grow">
        <button
          type="button"
          className="block lg:inline-block mt-4 lg:mt-0 text-slate-800 px-4 py-2 rounded hover:text-white hover:bg-slate-950 mr-2"
        >
          Menu 1
        </button>
        <button
          type="button"
          className="block lg:inline-block mt-4 lg:mt-0 text-slate-800 px-4 py-2 rounded hover:text-white hover:bg-slate-950 mr-2"
        >
          Menu 2
        </button>
        <button
          type="button"
          className="block lg:inline-block mt-4 lg:mt-0 text-slate-800 px-4 py-2 rounded hover:text-white hover:bg-slate-950 mr-2"
        >
          Menu 3
        </button>
      </div>

      <div className="flex">
        {currentUser ? (
          // Show user info and logout when authenticated
          <>
            <span className="block text-md px-4 py-2 text-slate-200 mt-4 lg:mt-0">
              Welcome, {currentUser}
            </span>
            <Link
              href="/settings/security"
              className="block text-md px-4 ml-2 py-2 rounded text-slate-200 font-bold hover:bg-slate-950 mt-4 lg:mt-0"
            >
              Security
            </Link>
            <button
              onClick={handleLogout}
              data-testid={isMobile ? "logout-mobile" : "logout-desktop"}
              className="block text-md px-4 ml-2 py-2 rounded text-slate-200 font-bold hover:bg-slate-950 mt-4 lg:mt-0"
            >
              Logout
            </button>
          </>
        ) : (
          // Show login/register links when not authenticated
          <>
            <Link
              href="/register"
              className="block text-md px-4 py-2 rounded text-slate-200 ml-2 font-bold hover:bg-slate-950 mt-4 lg:mt-0"
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="block text-md px-4 ml-2 py-2 rounded text-slate-200 font-bold hover:bg-slate-950 mt-4 lg:mt-0"
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
      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
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
        </div>
      </nav>
    </>
  );
}
