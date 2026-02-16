import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import client from '../api/client'
import { toast } from 'sonner'

const schema = z.object({ username: z.string().min(1, 'Nhập tên đăng nhập'), password: z.string().min(1, 'Nhập mật khẩu') })

export default function LoginPage({ onLogin }) {
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const submit = async (data) => {
    try {
      const res = await client.post('/auth/login', data)
      localStorage.setItem('token', res.data.access_token)
      onLogin()
      toast.success('Đăng nhập thành công')
    } catch {
      toast.error('Đăng nhập thất bại')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={handleSubmit(submit)} className="card w-full max-w-sm space-y-3">
        <h1 className="text-lg font-bold">Coffee Roastery Manager</h1>
        <input className="input" placeholder="Tên đăng nhập" {...register('username')} />
        <p className="text-red-500 text-xs">{errors.username?.message}</p>
        <input type="password" className="input" placeholder="Mật khẩu" {...register('password')} />
        <p className="text-red-500 text-xs">{errors.password?.message}</p>
        <button className="btn w-full">Đăng nhập</button>
      </form>
    </div>
  )
}
