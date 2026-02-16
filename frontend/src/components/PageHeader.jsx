export default function PageHeader({ title, description, action }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold text-stone-900">{title}</h1>
        {description ? <p className="text-sm text-stone-500">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}
