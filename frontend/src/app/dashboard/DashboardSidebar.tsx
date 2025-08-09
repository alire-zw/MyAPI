'use client';

import { useEffect, useState, useCallback } from 'react';
import LogoutButton from './LogoutButton';
import DashboardSquare03Icon from '../../../public/icons/dashboard-square-03-stroke-rounded';
import CatalogueIcon from '../../../public/icons/catalogue-stroke-rounded';
import Key02Icon from '../../../public/icons/key-02-stroke-rounded';
import Doc01Icon from '../../../public/icons/doc-01-stroke-rounded';
import Invoice02Icon from '../../../public/icons/invoice-02-stroke-rounded';
import QuestionIcon from '../../../public/icons/question-stroke-rounded';
import AccountSetting02Icon from '../../../public/icons/account-setting-02-stroke-rounded';
import PackageIcon from '../../../public/icons/package-stroke-rounded';
import Sun01Icon from '../../../public/icons/sun-01-stroke-rounded';
import Moon02Icon from '../../../public/icons/moon-02-stroke-rounded';

function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('theme');
      const initial = saved === 'dark' || saved === 'light' ? saved : 'light';
      document.documentElement.setAttribute('data-theme', initial);
      setTheme(initial);
    } catch {
      document.documentElement.setAttribute('data-theme', 'light');
      setTheme('light');
    }
  }, []);

  useEffect(() => {
    try { localStorage.setItem('theme', theme); } catch {}
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className="mt-3">
      <div
        className="grid grid-cols-2 gap-2 p-1 rounded-xl"
        style={{
          background: theme === 'dark' ? '#1d1d1d' : '#f3f4f6',
          border: `1px solid ${theme === 'dark' ? '#1d1d1d' : '#e5e7eb'}`,
        }}
      >
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm transition-colors focus:outline-none focus:ring-0 ${
            theme === 'light'
              ? 'bg-white text-black'
              : 'text-white/80 hover:text-white'
          }`}
        >
          <Sun01Icon width={16} height={16} color="currentColor" />
          <span>روشن</span>
        </button>
        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm transition-colors focus:outline-none focus:ring-0 ${
            theme === 'dark'
              ? 'bg-[#0f0f0f] text-white'
              : 'text-gray-700 hover:text-black'
          }`}
        >
          <Moon02Icon width={16} height={16} color="currentColor" />
          <span>تاریک</span>
        </button>
      </div>
    </div>
  );
}

type CollapsibleProps = { title: string; icon?: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean };

function Collapsible({ title, icon, children, defaultOpen = true }: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button type="button" onClick={() => setOpen(!open)} className="menu-item w-full text-right" aria-expanded={open}>
        {icon ? <span className="inline-flex items-center justify-center w-5 h-5 text-current">{icon}</span> : null}
        <span>{title}</span>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4 menu-chevron">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={open ? 'M6 15l6-6 6 6' : 'M19 9l-7 7-7-7'} />
        </svg>
      </button>
      {open && <div className="submenu">{children}</div>}
    </div>
  );
}

function IconWrap({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center justify-center w-5 h-5 text-current">{children}</span>;
}

function NavItems() {
  return (
    <nav aria-label="منوی داشبورد" className="mt-4">
      <div className="menu-list">
        <a className="menu-item cursor-pointer">
          <IconWrap><DashboardSquare03Icon width={20} height={20} color="currentColor" /></IconWrap>
          <span>پیشخوان</span>
        </a>
        <a className="menu-item cursor-pointer">
          <IconWrap><CatalogueIcon width={20} height={20} color="currentColor" /></IconWrap>
          <span>کاتالوگ API</span>
        </a>
        <a className="menu-item cursor-pointer">
          <IconWrap><PackageIcon width={20} height={20} color="currentColor" /></IconWrap>
          <span>سفارش‌ها و اشتراک‌ها</span>
        </a>
        <a className="menu-item cursor-pointer">
          <IconWrap><Key02Icon width={20} height={20} color="currentColor" /></IconWrap>
          <span>کلیدهای API</span>
        </a>
        <a className="menu-item cursor-pointer">
          <IconWrap><Doc01Icon width={20} height={20} color="currentColor" /></IconWrap>
          <span>مستندات</span>
        </a>

        <Collapsible title="صورت‌حساب و پرداخت‌ها" icon={<Invoice02Icon width={20} height={20} color="currentColor" />} defaultOpen>
          <a className="menu-item menu-item-muted cursor-pointer">صورتحساب‌های من</a>
          <a className="menu-item menu-item-muted cursor-pointer">شارژ کیف‌پول</a>
          <a className="menu-item menu-item-muted cursor-pointer">بازگشت وجه</a>
          <a className="menu-item menu-item-muted cursor-pointer">گزارش تراکنش‌ها</a>
        </Collapsible>

        <a className="menu-item cursor-pointer">
          <IconWrap><QuestionIcon width={20} height={20} color="currentColor" /></IconWrap>
          <span>پشتیبانی و تیکت‌ها</span>
        </a>
        <a className="menu-item cursor-pointer">
          <IconWrap><AccountSetting02Icon width={20} height={20} color="currentColor" /></IconWrap>
          <span>تنظیمات حساب</span>
        </a>
      </div>
    </nav>
  );
}

export default function DashboardSidebar() {
  const [isOpen, setIsOpen] = useState(false);

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [close]);

  useEffect(() => {
    if (isOpen) {
      const { overflow } = document.body.style;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = overflow;
      };
    }
  }, [isOpen]);

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-30 sidebar sidebar-header px-4 py-3 flex items-center justify-between">
        <h1 className="text-base font-semibold">داشبورد</h1>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200/60 hover:bg-gray-50"
          aria-label="باز کردن منو"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className="w-5 h-5 text-gray-800"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col h-screen w-72 sidebar px-4 py-6" style={{ borderLeft: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-bold">داشبورد</div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="sidebar-section-title mb-2">اصلی</div>
          <NavItems />
        </div>
        <div className="pt-4 space-y-4">
          <LogoutButton />
          <ThemeToggle />
        </div>
      </aside>

      {/* Mobile drawer */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={close}
            aria-hidden="true"
          />
          <div
            className={`fixed inset-y-0 right-0 w-72 sidebar z-50 p-5 transform transition-transform duration-200 ease-out flex flex-col h-full ${
              isOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
            role="dialog"
            aria-modal="true"
          >
            <div style={{ borderLeft: '1px solid var(--border)' }} className="absolute left-0 top-0 h-full" />
            <div className="flex items-center justify-between mb-4">
              <div className="text-base font-semibold">منو</div>
              <button
                type="button"
                onClick={close}
                className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200/60 hover:bg-gray-50"
                aria-label="بستن منو"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="sidebar-section-title mb-2">اصلی</div>
              <NavItems />
            </div>
            <div className="pt-4 space-y-4">
              <LogoutButton />
              <ThemeToggle />
            </div>
          </div>
        </>
      )}
    </>
  );
}


