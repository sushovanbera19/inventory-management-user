// Contact: support details and a message form.
import { useForm } from 'react-hook-form'
import { motion } from 'motion/react'
import { Clock, Mail, MapPin, Phone, Send } from 'lucide-react'
import { Button, Input, Select, Textarea } from '@/components/ui'
import { SUPPORT } from '@/config/app'
import { useToast } from '@/context/ToastContext'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useContact } from '@/queries'

export default function ContactPage() {
  usePageTitle('Contact us')
  const toast = useToast()
  const contact = useContact()
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ defaultValues: { name: '', email: '', subject: 'Order help', message: '' } })

  async function onSubmit(values) {
    try {
      const { ticket } = await contact.mutateAsync(values)
      toast.success('Message sent!', { description: `Ticket ${ticket}. We reply within one working day.` })
      reset()
    } catch (error) {
      toast.error('Could not send', { description: error.message })
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl font-bold tracking-tight">Get in touch</h1>
      <p className="mt-2 text-fg-muted">Questions about an order or a product? We're happy to help.</p>
      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-4">
          {[[Phone, 'Call us', SUPPORT.phone], [Mail, 'Email', SUPPORT.email], [MapPin, 'Visit', SUPPORT.address], [Clock, 'Hours', SUPPORT.hours]].map(([Icon, title, text], index) => (
            <motion.div key={title} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.08 }} className="flex gap-4 rounded-2xl border border-line bg-surface p-5 shadow-card">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-fg"><Icon className="size-5" /></span>
              <span className="min-w-0"><span className="block font-semibold">{title}</span><span className="block break-words text-sm text-fg-muted">{text}</span></span>
            </motion.div>
          ))}
        </div>
        <motion.form initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-3xl border border-line bg-surface p-6 shadow-card sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Your name" error={errors.name?.message} {...register('name', { required: 'Enter your name' })} />
            <Input label="Email" type="email" error={errors.email?.message} {...register('email', { required: 'Enter your email' })} />
          </div>
          <Select label="Topic" options={['Order help', 'Returns & refunds', 'Bulk / business orders', 'Product question', 'Something else'].map((value) => ({ value, label: value }))} {...register('subject')} />
          <Textarea label="Message" rows={5} error={errors.message?.message} {...register('message', { required: 'Write your message' })} />
          <Button type="submit" size="lg" leftIcon={<Send />} loading={contact.isPending}>Send message</Button>
        </motion.form>
      </div>
    </div>
  )
}
