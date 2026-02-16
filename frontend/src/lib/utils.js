export const formatCurrency = (value = 0) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value)

export const formatKg = (value = 0) => `${Number(value || 0).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} kg`

export const formatDate = (value) => {
  if (!value) return '--'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '--' : date.toLocaleDateString('vi-VN')
}

export const apiErrorMessage = (error) => {
  const detail = error?.response?.data?.detail
  if (Array.isArray(detail)) return detail.map((item) => item.msg).join('; ')
  if (typeof detail === 'string') return detail
  return 'Có lỗi xảy ra, vui lòng thử lại.'
}
