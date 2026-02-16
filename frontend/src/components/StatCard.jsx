export default function StatCard({ label, value, tone = 'default' }) {
  const tones = {
    default: 'from-amber-50 to-white border-amber-100',
    danger: 'from-red-50 to-white border-red-100',
  }

  return (
    <article className={`rounded-2xl border bg-gradient-to-br p-4 shadow-sm ${tones[tone] || tones.default}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-stone-900">{value}</p>
    </article>
  )
}
