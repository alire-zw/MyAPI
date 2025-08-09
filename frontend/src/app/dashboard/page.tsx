export default function DashboardPage() {
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--foreground)' }}>خلاصه وضعیت</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>به داشبورد خوش آمدید</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <div className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="text-sm mb-1" style={{ color: 'var(--muted)' }}>درخواست‌های امروز</div>
          <div className="text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>0</div>
        </div>
        <div className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="text-sm mb-1" style={{ color: 'var(--muted)' }}>کل درخواست‌ها</div>
          <div className="text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>0</div>
        </div>
        <div className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="text-sm mb-1" style={{ color: 'var(--muted)' }}>وضعیت سرویس</div>
          <div className="text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>سالم</div>
        </div>
      </div>
    </section>
  );
}


