// My account: overview, order history, saved addresses, profile & password.
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { Ban, Heart, LogOut, MapPin, Package, Pencil, Plus, ShoppingBag, Trash2, UserRound } from 'lucide-react'
import { authApi } from '@/api'
import { CancelOrderDialog } from '@/components/store/CancelOrderDialog'
import { CAN_CANCEL } from '@/lib/orderRules'
import { Avatar, Badge, Button, EmptyState, Input, Pagination, Tabs } from '@/components/ui'
import { useAuth, useCart, useWishlist } from '@/context/StoreContexts'
import { useConfirm } from '@/context/ConfirmContext'
import { useToast } from '@/context/ToastContext'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useQueryState } from '@/hooks/useQueryState'
import { ORDER_STATUS } from '@/lib/constants'
import { formatCurrency, formatDate } from '@/lib/format'
import { useChangePassword, useMyOrders } from '@/queries'
import { AddressForm } from '../CheckoutPage.jsx'

export default function AccountPage() {
  usePageTitle('My account')
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [{ tab }, setQuery] = useQueryState({ tab: 'overview' })

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="relative mb-8 flex flex-wrap items-center gap-4 overflow-hidden rounded-3xl bg-gradient-brand p-6 text-white shadow-glow sm:p-8">
        <div className="absolute -right-10 -top-10 size-48 rounded-full bg-white/10 blur-2xl" />
        <Avatar name={user.name} size="xl" className="ring-white/30" />
        <div className="relative">
          <p className="text-sm text-white/80">Welcome back</p>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">{user.name}</h1>
          <p className="text-sm text-white/80">{user.email}</p>
        </div>
        <Button variant="secondary" className="relative ml-auto" leftIcon={<LogOut />} onClick={() => { logout(); navigate('/') }}>Sign out</Button>
      </div>

      <Tabs value={tab} onChange={(value) => setQuery({ tab: value })} items={[{ value: 'overview', label: 'Overview', icon: <UserRound /> }, { value: 'orders', label: 'Orders', icon: <Package /> }, { value: 'addresses', label: 'Addresses', icon: <MapPin /> }, { value: 'profile', label: 'Profile', icon: <Pencil /> }]} />
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="pt-8">
          {tab === 'overview' && <Overview onTab={(value) => setQuery({ tab: value })} />}
          {tab === 'orders' && <Orders />}
          {tab === 'addresses' && <Addresses />}
          {tab === 'profile' && <Profile />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function Overview({ onTab }) {
  const { data } = useMyOrders({ pageSize: 3 })
  const wishlist = useWishlist()
  const cart = useCart()
  const tiles = [
    { icon: Package, label: 'Orders', value: data?.meta.total ?? '—', onClick: () => onTab('orders') },
    { icon: Heart, label: 'Wishlist', value: wishlist.ids.length, to: '/wishlist' },
    { icon: ShoppingBag, label: 'In cart', value: cart.count, onClick: cart.open },
  ]
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        {tiles.map((tile, index) => {
          const content = (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }} className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 text-left shadow-card transition-all hover:-translate-y-0.5 hover:shadow-raised">
              <span className="grid size-12 place-items-center rounded-xl bg-brand-soft text-brand-fg"><tile.icon className="size-5" /></span>
              <span><span className="block font-display text-2xl font-bold">{tile.value}</span><span className="text-sm text-fg-muted">{tile.label}</span></span>
            </motion.div>
          )
          return tile.to ? <Link key={tile.label} to={tile.to}>{content}</Link> : <button key={tile.label} type="button" onClick={tile.onClick} className="text-left">{content}</button>
        })}
      </div>
      <div>
        <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-semibold">Recent orders</h2><Button variant="ghost" size="sm" onClick={() => onTab('orders')}>View all</Button></div>
        <OrderList orders={data?.data} />
      </div>
    </div>
  )
}

function OrderList({ orders }) {
  const [cancelling, setCancelling] = useState(null)
  if (!orders) return <div className="skeleton h-40 rounded-2xl" />
  if (!orders.length) return <EmptyState icon={<Package />} title="No orders yet" description="Your orders will appear here." action={<Button to="/shop">Start shopping</Button>} />
  return (
    <>
      <ul className="space-y-3">
        {orders.map((order) => (
          <li key={order.id}>
            <Link to={`/account/orders/${order.orderNumber}`} className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-surface p-4 shadow-card transition-all hover:border-line-strong hover:shadow-raised">
              <div className="flex -space-x-3">
                {order.items.slice(0, 3).map((item) => <img key={item.id} src={item.imageUrl} alt="" className="size-12 rounded-xl border-2 border-surface object-cover" />)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-mono font-semibold">{order.orderNumber}</p>
                <p className="text-sm text-fg-muted">{formatDate(order.createdAt)} · {order.itemsCount} items</p>
              </div>
              <Badge tone={ORDER_STATUS[order.status].tone}>{ORDER_STATUS[order.status].label}</Badge>
              {CAN_CANCEL.includes(order.status) && (
                <Button
                  size="sm"
                  variant="danger-soft"
                  leftIcon={<Ban />}
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    setCancelling(order)
                  }}
                >
                  Cancel
                </Button>
              )}
              <p className="w-24 text-right font-bold tabular-nums">{formatCurrency(order.total)}</p>
            </Link>
          </li>
        ))}
      </ul>
      <CancelOrderDialog order={cancelling} open={Boolean(cancelling)} onClose={() => setCancelling(null)} />
    </>
  )
}

function Orders() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('all')
  const { data } = useMyOrders({ page, pageSize: 8, status })
  return (
    <div className="space-y-4">
      <Tabs variant="pills" value={status} onChange={(value) => { setStatus(value); setPage(1) }} items={[{ value: 'all', label: 'All' }, ...Object.entries(ORDER_STATUS).map(([value, meta]) => ({ value, label: meta.label }))]} />
      <OrderList orders={data?.data} />
      {data && data.meta.total > 8 && <div className="rounded-2xl border border-line bg-surface"><Pagination page={page} pageSize={8} total={data.meta.total} onPageChange={setPage} itemLabel="orders" /></div>}
    </div>
  )
}

function Addresses() {
  const { user, setUser } = useAuth()
  const toast = useToast()
  const confirm = useConfirm()
  const [editing, setEditing] = useState(null)

  async function remove(address) {
    if (!(await confirm({ title: 'Delete this address?', description: `${address.label}: ${address.line1}`, confirmLabel: 'Delete' }))) return
    setUser(await authApi.removeAddress(address.id))
    toast.success('Address deleted')
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {(user.addresses ?? []).map((address) => (
          <div key={address.id} className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 font-semibold"><MapPin className="size-4 text-brand-fg" />{address.label}</p>
              {address.isDefault && <Badge tone="brand" size="sm">Default</Badge>}
            </div>
            <p className="mt-2 text-sm">{address.name} · {address.phone}</p>
            <p className="text-sm text-fg-muted">{address.line1}{address.line2 ? `, ${address.line2}` : ''}, {address.city}, {address.state} {address.postalCode}</p>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="secondary" leftIcon={<Pencil />} onClick={() => setEditing(address)}>Edit</Button>
              <Button size="sm" variant="ghost" leftIcon={<Trash2 />} onClick={() => remove(address)}>Delete</Button>
            </div>
          </div>
        ))}
        {!editing && <button type="button" onClick={() => setEditing({})} className="grid min-h-40 place-items-center rounded-2xl border-2 border-dashed border-line font-medium text-fg-muted hover:border-brand-500 hover:text-brand-fg"><span className="flex items-center gap-2"><Plus className="size-4" />Add address</span></button>}
      </div>
      {editing && <AddressForm key={editing.id ?? 'new'} user={user} address={editing.id ? editing : undefined} onSaved={(updated) => { setUser(updated); setEditing(null) }} onCancel={() => setEditing(null)} />}
    </div>
  )
}

function Profile() {
  const { user, setUser } = useAuth()
  const toast = useToast()
  const changePassword = useChangePassword()
  const profile = useForm({ defaultValues: { name: user.name, phone: user.phone } })
  const password = useForm({ defaultValues: { currentPassword: '', newPassword: '' } })

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form className="space-y-4 rounded-2xl border border-line bg-surface p-6 shadow-card" onSubmit={profile.handleSubmit(async (values) => { setUser(await authApi.updateProfile(values)); toast.success('Profile saved') })}>
        <h2 className="text-lg font-semibold">Personal details</h2>
        <Input label="Full name" error={profile.formState.errors.name?.message} {...profile.register('name', { required: 'Enter your name' })} />
        <Input label="Email" value={user.email} disabled readOnly />
        <Input label="Phone" {...profile.register('phone')} />
        <Button type="submit" loading={profile.formState.isSubmitting}>Save changes</Button>
      </form>
      <form className="space-y-4 rounded-2xl border border-line bg-surface p-6 shadow-card" onSubmit={password.handleSubmit(async (values) => {
        try {
          await changePassword.mutateAsync(values)
          toast.success('Password changed')
          password.reset()
        } catch (error) {
          toast.error('Could not change the password', { description: error.message })
        }
      })}>
        <h2 className="text-lg font-semibold">Change password</h2>
        <Input label="Current password" type="password" {...password.register('currentPassword', { required: true })} />
        <Input label="New password" type="password" hint="At least 8 characters" {...password.register('newPassword', { required: true, minLength: 8 })} />
        <Button type="submit" loading={changePassword.isPending}>Update password</Button>
      </form>
    </div>
  )
}
