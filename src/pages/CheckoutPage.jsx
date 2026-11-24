// Checkout: delivery address → payment method → review and place the order.
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { AnimatePresence, motion } from 'motion/react'
import { Banknote, Check, CreditCard, Landmark, MapPin, Plus, ShieldCheck, Smartphone } from 'lucide-react'
import { Button, EmptyState, Input, Stepper, Textarea } from '@/components/ui'
import { useAuth, useCart } from '@/context/StoreContexts'
import { useToast } from '@/context/ToastContext'
import { usePageTitle } from '@/hooks/usePageTitle'
import { authApi } from '@/api'
import { cn } from '@/lib/cn'
import { formatCurrency } from '@/lib/format'
import { usePlaceOrder, useQuote } from '@/queries'
import { OrderSummary } from './CartPage.jsx'

const METHODS = [
  { value: 'upi', label: 'UPI', description: 'GPay, PhonePe, Paytm', icon: Smartphone },
  { value: 'card', label: 'Credit / debit card', description: 'Visa, Mastercard, RuPay', icon: CreditCard },
  { value: 'bank_transfer', label: 'Bank transfer', description: 'We ship once it arrives', icon: Landmark },
  { value: 'cod', label: 'Cash on delivery', description: 'Pay when it arrives', icon: Banknote },
]
const STEPS = [{ key: 'address', label: 'Address' }, { key: 'payment', label: 'Payment' }, { key: 'review', label: 'Review' }]

export default function CheckoutPage() {
  usePageTitle('Checkout')
  const { user, setUser } = useAuth()
  const cart = useCart()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const placeOrder = usePlaceOrder()
  const [step, setStep] = useState(0)
  const [addressId, setAddressId] = useState(() => user?.addresses?.find((item) => item.isDefault)?.id ?? user?.addresses?.[0]?.id ?? null)
  const [adding, setAdding] = useState(!user?.addresses?.length)
  const [method, setMethod] = useState('upi')
  const [notes, setNotes] = useState('')
  const coupon = location.state?.coupon ?? ''
  const quote = useQuote(cart.items, coupon)
  const address = user?.addresses?.find((item) => item.id === addressId)

  if (!cart.items.length && !placeOrder.isSuccess) {
    return <div className="mx-auto max-w-3xl px-4 py-16"><EmptyState title="Your cart is empty" description="Add something before checking out." action={<Button to="/shop">Go shopping</Button>} /></div>
  }

  async function place() {
    try {
      const order = await placeOrder.mutateAsync({ items: cart.items.map((item) => ({ productId: item.productId, quantity: item.quantity })), address, paymentMethod: method, couponCode: coupon, notes })
      cart.clear()
      navigate(`/order-success/${order.orderNumber}`, { replace: true })
    } catch (error) {
      toast.error('Could not place your order', { description: error.message })
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold tracking-tight">Checkout</h1>
      <div className="mt-6 max-w-xl"><Stepper steps={STEPS} current={step} /></div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="rounded-3xl border border-line bg-surface p-5 shadow-card sm:p-7">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              {step === 0 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Where should we deliver?</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(user?.addresses ?? []).map((item) => (
                      <button key={item.id} type="button" onClick={() => { setAddressId(item.id); setAdding(false) }} className={cn('relative rounded-2xl border-2 p-4 text-left transition-all', addressId === item.id && !adding ? 'border-brand-500 bg-brand-soft/40 ring-4 ring-brand-500/10' : 'border-line hover:border-line-strong')}>
                        {addressId === item.id && !adding && <span className="absolute right-3 top-3 grid size-6 place-items-center rounded-full bg-brand-600 text-white"><Check className="size-3.5" /></span>}
                        <p className="flex items-center gap-2 text-sm font-semibold"><MapPin className="size-4 text-brand-fg" />{item.label}</p>
                        <p className="mt-1 text-sm">{item.name}</p>
                        <p className="text-sm text-fg-muted">{item.line1}{item.line2 ? `, ${item.line2}` : ''}, {item.city} {item.postalCode}</p>
                        <p className="text-xs text-fg-subtle">{item.phone}</p>
                      </button>
                    ))}
                    {!adding && (
                      <button type="button" onClick={() => setAdding(true)} className="grid min-h-28 place-items-center rounded-2xl border-2 border-dashed border-line text-sm font-medium text-fg-muted hover:border-brand-500 hover:text-brand-fg"><span className="flex items-center gap-2"><Plus className="size-4" />New address</span></button>
                    )}
                  </div>
                  <AnimatePresence>
                    {adding && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <AddressForm user={user} onSaved={(updated, id) => { setUser(updated); setAddressId(id); setAdding(false) }} onCancel={user?.addresses?.length ? () => setAdding(false) : undefined} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="flex justify-end"><Button disabled={!address || adding} onClick={() => setStep(1)}>Continue to payment</Button></div>
                </div>
              )}
              {step === 1 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">How would you like to pay?</h2>
                  <div className="grid gap-3 sm:grid-cols-2" role="radiogroup">
                    {METHODS.map((item) => (
                      <button key={item.value} type="button" role="radio" aria-checked={method === item.value} onClick={() => setMethod(item.value)} className={cn('flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all', method === item.value ? 'border-brand-500 bg-brand-soft/40 ring-4 ring-brand-500/10' : 'border-line hover:border-line-strong')}>
                        <span className={cn('grid size-11 place-items-center rounded-xl', method === item.value ? 'bg-brand-600 text-white' : 'bg-surface-2 text-fg-muted')}><item.icon className="size-5" /></span>
                        <span><span className="block font-semibold">{item.label}</span><span className="block text-xs text-fg-subtle">{item.description}</span></span>
                      </button>
                    ))}
                  </div>
                  <p className="flex items-center gap-2 rounded-xl bg-surface-2 p-3 text-xs text-fg-muted"><ShieldCheck className="size-4 text-success" />Demo store: no real payment is taken. Connect a payment gateway on your backend.</p>
                  <div className="flex justify-between"><Button variant="ghost" onClick={() => setStep(0)}>Back</Button><Button onClick={() => setStep(2)}>Review order</Button></div>
                </div>
              )}
              {step === 2 && (
                <div className="space-y-5">
                  <h2 className="text-lg font-semibold">Review your order</h2>
                  <ul className="divide-y divide-line rounded-2xl border border-line">
                    {cart.items.map((item) => (
                      <li key={item.productId} className="flex items-center gap-3 p-3">
                        <img src={item.imageUrl} alt="" className="size-14 rounded-lg object-cover" />
                        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{item.name}</span><span className="text-xs text-fg-subtle">Qty {item.quantity}</span></span>
                        <span className="text-sm font-semibold tabular-nums">{formatCurrency(item.price * item.quantity)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="grid gap-3 text-sm sm:grid-cols-2">
                    <div className="rounded-2xl bg-surface-2 p-4"><p className="mb-1 font-semibold">Delivering to</p><p className="text-fg-muted">{address?.name}, {address?.line1}, {address?.city} {address?.postalCode}</p></div>
                    <div className="rounded-2xl bg-surface-2 p-4"><p className="mb-1 font-semibold">Payment</p><p className="text-fg-muted">{METHODS.find((item) => item.value === method)?.label}</p></div>
                  </div>
                  <Textarea label="Order notes" optional rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Delivery instructions…" />
                  <div className="flex justify-between"><Button variant="ghost" onClick={() => setStep(1)}>Back</Button><Button size="lg" loading={placeOrder.isPending} onClick={place}>Place order · {formatCurrency(quote.data?.total ?? 0)}</Button></div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="lg:sticky lg:top-24 lg:self-start"><OrderSummary quote={quote.data} couponCode={coupon} /></div>
      </div>
    </div>
  )
}

export function AddressForm({ user, address, onSaved, onCancel }) {
  const toast = useToast()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: address ?? { label: 'Home', name: user?.name ?? '', phone: user?.phone ?? '', line1: '', line2: '', city: '', state: '', postalCode: '', country: 'India', isDefault: !user?.addresses?.length },
  })
  async function onSubmit(values) {
    try {
      const known = new Set((user?.addresses ?? []).map((item) => item.id))
      const updated = await authApi.saveAddress(values)
      // A new address gets its id from the server: it is the one we did not have before.
      const id = values.id || updated.addresses.find((item) => !known.has(item.id))?.id
      toast.success('Address saved')
      onSaved(updated, id)
    } catch (error) {
      toast.error('Could not save the address', { description: error.message })
    }
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 rounded-2xl border border-line p-4 sm:grid-cols-2">
      <Input label="Label" placeholder="Home, Office…" {...register('label')} />
      <Input label="Full name" error={errors.name?.message} {...register('name', { required: 'Enter a name' })} />
      <Input label="Phone" type="tel" error={errors.phone?.message} {...register('phone', { required: 'Enter a phone number' })} />
      <Input label="PIN code" inputMode="numeric" error={errors.postalCode?.message} {...register('postalCode', { required: 'Enter the PIN code', pattern: { value: /^\d{6}$/, message: '6 digits' } })} />
      <Input label="Address line 1" containerClassName="sm:col-span-2" error={errors.line1?.message} {...register('line1', { required: 'Enter the address' })} />
      <Input label="Address line 2" optional containerClassName="sm:col-span-2" {...register('line2')} />
      <Input label="City" error={errors.city?.message} {...register('city', { required: 'Enter the city' })} />
      <Input label="State" {...register('state')} />
      <div className="flex gap-2 sm:col-span-2 sm:justify-end">
        {onCancel && <Button variant="ghost" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" loading={isSubmitting}>Save address</Button>
      </div>
    </form>
  )
}
