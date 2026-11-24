// Sign in, create an account, or reset a password — one page, three modes.
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { CircleAlert, Eye, EyeOff, KeyRound, Mail, Sparkles } from 'lucide-react'
import { USE_MOCK } from '@/api'
import { LogoMark } from '@/components/brand/Logo'
import { Button, Input } from '@/components/ui'
import { APP_NAME, DEMO_CREDENTIALS } from '@/config/app'
import { useAuth } from '@/context/StoreContexts'
import { useToast } from '@/context/ToastContext'
import { usePageTitle } from '@/hooks/usePageTitle'

const EMAIL = { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' }
const COPY = {
  login: { title: 'Welcome back', text: 'Sign in to check out faster and track your orders.' },
  register: { title: 'Create your account', text: 'Join in seconds and get 10% off your first order.' },
  forgot: { title: 'Reset your password', text: 'We will email you a link to choose a new one.' },
}

export default function AuthPage({ mode }) {
  usePageTitle(mode === 'login' ? 'Sign in' : mode === 'register' ? 'Create account' : 'Reset password')
  return (
    <div className="relative overflow-hidden px-4 py-12 sm:py-20">
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 size-[40rem] -translate-x-1/2 rounded-full bg-brand-500/15 blur-[120px]" />
      <motion.div key={mode} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="relative mx-auto max-w-md rounded-3xl border border-line bg-surface p-7 shadow-pop sm:p-9">
        <div className="text-center">
          <LogoMark size={44} className="mx-auto" />
          <h1 className="mt-4 font-display text-2xl font-bold">{COPY[mode].title}</h1>
          <p className="mt-1 text-sm text-fg-muted">{COPY[mode].text}</p>
        </div>
        {mode === 'forgot' ? <ForgotForm /> : <CredentialsForm key={mode} mode={mode} />}
      </motion.div>
    </div>
  )
}

function CredentialsForm({ mode }) {
  const { login, register: createAccount } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [shake, setShake] = useState(0)
  const isLogin = mode === 'login'
  const { register, handleSubmit, setValue, setError: setFieldError, formState: { errors, isSubmitting } } = useForm({
    defaultValues: isLogin && USE_MOCK ? { ...DEMO_CREDENTIALS } : { name: '', email: '', phone: '', password: '' },
  })

  async function onSubmit(values) {
    setError('')
    try {
      const user = isLogin ? await login(values) : await createAccount(values)
      toast.success(isLogin ? `Welcome back, ${user.name.split(' ')[0]}!` : `Welcome to ${APP_NAME}, ${user.name.split(' ')[0]}!`)
      const from = location.state?.from
      navigate(from ? `${from.pathname}${from.search ?? ''}` : '/account', { replace: true })
    } catch (err) {
      if (err.fieldErrors) Object.entries(err.fieldErrors).forEach(([field, message]) => setFieldError(field, { message }))
      setError(err.message)
      setShake((value) => value + 1)
    }
  }

  return (
    <>
      <motion.form key={shake} noValidate onSubmit={handleSubmit(onSubmit)} animate={shake ? { x: [0, -10, 10, -6, 6, 0] } : undefined} transition={{ duration: 0.4 }} className="mt-7 space-y-4">
        <AnimatePresence>
          {error && (
            <motion.p role="alert" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-start gap-2 overflow-hidden rounded-xl bg-danger-soft px-3 py-2.5 text-sm text-danger-fg">
              <CircleAlert className="mt-0.5 size-4 shrink-0" />{error}
            </motion.p>
          )}
        </AnimatePresence>
        {!isLogin && <Input label="Full name" autoComplete="name" error={errors.name?.message} {...register('name', { required: 'Enter your name' })} />}
        <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email', { required: 'Enter your email', pattern: EMAIL })} />
        {!isLogin && <Input label="Phone" type="tel" optional autoComplete="tel" {...register('phone')} />}
        <Input
          label="Password"
          type={show ? 'text' : 'password'}
          autoComplete={isLogin ? 'current-password' : 'new-password'}
          hint={isLogin ? undefined : 'At least 8 characters'}
          error={errors.password?.message}
          rightElement={<button type="button" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow((value) => !value)} className="grid size-8 place-items-center rounded-lg text-fg-subtle hover:bg-surface-2">{show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>}
          {...register('password', { required: 'Enter a password', minLength: isLogin ? undefined : { value: 8, message: 'Use at least 8 characters' } })}
        />
        {isLogin && <div className="text-right"><Link to="/forgot-password" className="text-sm font-medium text-brand-fg hover:underline">Forgot password?</Link></div>}
        <Button type="submit" size="lg" fullWidth loading={isSubmitting}>{isLogin ? 'Sign in' : 'Create account'}</Button>
      </motion.form>

      {isLogin && USE_MOCK && (
        <div className="mt-6 rounded-2xl border border-dashed border-brand-500/40 bg-brand-soft/40 p-4 text-sm">
          <p className="flex items-center gap-2 font-semibold"><Sparkles className="size-4 text-brand-fg" />Demo customer</p>
          <p className="mt-1 font-mono text-xs text-fg-muted">{DEMO_CREDENTIALS.email} · {DEMO_CREDENTIALS.password}</p>
          <Button variant="soft" size="sm" fullWidth className="mt-3" leftIcon={<KeyRound />} onClick={() => { setValue('email', DEMO_CREDENTIALS.email); setValue('password', DEMO_CREDENTIALS.password) }}>Use demo account</Button>
        </div>
      )}

      <p className="mt-6 text-center text-sm text-fg-muted">
        {isLogin ? 'New here? ' : 'Already have an account? '}
        <Link to={isLogin ? '/register' : '/login'} state={location.state} className="font-semibold text-brand-fg hover:underline">{isLogin ? 'Create an account' : 'Sign in'}</Link>
      </p>
    </>
  )
}

function ForgotForm() {
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: { email: '' } })
  return sent ? (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-7 text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-success-soft text-success-fg"><Mail className="size-6" /></span>
      <p className="mt-3 font-semibold">Check your inbox</p>
      <p className="mt-1 text-sm text-fg-muted">If an account exists for that email, a reset link is on its way. (Sending e-mail needs the backend.)</p>
      <Button variant="secondary" className="mt-6" to="/login">Back to sign in</Button>
    </motion.div>
  ) : (
    <form onSubmit={handleSubmit(() => setSent(true))} className="mt-7 space-y-4">
      <Input label="Email" type="email" error={errors.email?.message} {...register('email', { required: 'Enter your email', pattern: EMAIL })} />
      <Button type="submit" size="lg" fullWidth>Send reset link</Button>
      <p className="text-center text-sm"><Link to="/login" className="font-semibold text-brand-fg hover:underline">Back to sign in</Link></p>
    </form>
  )
}
