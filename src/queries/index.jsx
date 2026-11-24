// Data hooks for the shop pages (TanStack Query). Pages never call the API directly.
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authApi, catalogApi, ordersApi, supportApi } from '@/api'

function clean(params = {}) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '' && value !== 'all' && value !== false))
}

export const useCategories = () => useQuery({ queryKey: ['categories'], queryFn: catalogApi.categories, staleTime: 5 * 60_000 })

export function useProducts(params) {
  const filters = clean(params)
  return useQuery({ queryKey: ['products', filters], queryFn: () => catalogApi.products(filters), placeholderData: keepPreviousData })
}

export const useProduct = (slug) => useQuery({ queryKey: ['product', slug], queryFn: () => catalogApi.product(slug), enabled: Boolean(slug) })

export function useSearch(query) {
  const term = query.trim()
  return useQuery({ queryKey: ['search', term], queryFn: () => catalogApi.search(term), enabled: term.length >= 2, placeholderData: keepPreviousData })
}

export function useQuote(items, couponCode) {
  const lines = items.map((item) => ({ productId: item.productId, quantity: item.quantity }))
  return useQuery({ queryKey: ['quote', lines, couponCode], queryFn: () => ordersApi.quote({ items: lines, couponCode }), placeholderData: keepPreviousData, retry: false })
}

export const useMyOrders = (params, enabled = true) => useQuery({ queryKey: ['orders', clean(params)], queryFn: () => ordersApi.mine(clean(params)), enabled, placeholderData: keepPreviousData })
export const useMyOrder = (orderNumber) => useQuery({ queryKey: ['order', orderNumber], queryFn: () => ordersApi.get(orderNumber), enabled: Boolean(orderNumber) })

export function usePlaceOrder() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ordersApi.place,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['orders'] })
      client.invalidateQueries({ queryKey: ['products'] })
      client.invalidateQueries({ queryKey: ['product'] })
    },
  })
}

export function useCancelOrder() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ orderNumber, reason, note }) => ordersApi.cancel(orderNumber, { reason, note }),
    onSuccess: (order) => {
      client.setQueryData(['order', order.orderNumber], order)
      client.invalidateQueries({ queryKey: ['orders'] })
      client.invalidateQueries({ queryKey: ['products'] })
      client.invalidateQueries({ queryKey: ['product'] })
    },
  })
}

export const useTrackOrder = () => useMutation({ mutationFn: ordersApi.track })
export const useSubscribe = () => useMutation({ mutationFn: supportApi.subscribe })
export const useContact = () => useMutation({ mutationFn: supportApi.contact })
export const useChangePassword = () => useMutation({ mutationFn: authApi.changePassword })
