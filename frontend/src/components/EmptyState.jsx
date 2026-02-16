export default function EmptyState({ title, description, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-6 text-center">
      <p className="text-base font-medium text-stone-800">{title}</p>
      {description ? <p className="mt-1 text-sm text-stone-500">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
