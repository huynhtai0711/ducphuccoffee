import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import client from '../api/client'
import { toast } from 'sonner'
import { apiErrorMessage } from '../lib/utils'

const schema = z.object({ username: z.string().min(1, 'Nhập tên đăng nhập'), password: z.string().min(1, 'Nhập mật khẩu') })

export default function LoginPage({ onLogin }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) })

  const submit = async (data) => {
    try {
      const res = await client.post('/auth/login', data)
      onLogin(res.data.access_token)
      toast.success('Đăng nhập thành công')
    } catch (error) {
      toast.error(apiErrorMessage(error))
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fef3c7,_#f5f5f4)] p-4 flex items-center justify-center">
      <form onSubmit={handleSubmit(submit)} className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-lg space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-amber-700">Coffee modern</p>
        <h1 className="text-2xl font-semibold">Coffee Roastery Manager</h1>
        <div>
          <label className="label">Tên đăng nhập</label>
          <input className="input" placeholder="admin" {...register('username')} />
          <p className="field-error">{errors.username?.message}</p>
        </div>
        <div>
          <label className="label">Mật khẩu</label>
          <input type="password" className="input" placeholder="••••••" {...register('password')} />
          <p className="field-error">{errors.password?.message}</p>
        </div>
        <button disabled={isSubmitting} className="btn w-full">{isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
      </form>
    </div>
  )
}
