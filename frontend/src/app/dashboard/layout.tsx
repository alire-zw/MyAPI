import DashboardSidebar from './DashboardSidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <DashboardSidebar />
      <main className="flex-1 px-4 md:px-8 py-6 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
