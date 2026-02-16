import { X } from 'lucide-react'

export default function MobileSheet({ open, title, onClose, children, footer }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose}>
      <div
        className="absolute inset-x-0 bottom-0 max-h-[90vh] rounded-t-3xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-4 py-3">
          <p className="font-semibold">{title}</p>
          <button className="rounded-full p-1 text-stone-500" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="max-h-[calc(90vh-120px)] overflow-y-auto p-4 pb-32">{children}</div>
        <div className="absolute inset-x-0 bottom-0 border-t bg-white p-4">{footer}</div>
      </div>
    </div>
  )
}
