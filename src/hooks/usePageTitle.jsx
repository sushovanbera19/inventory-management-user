// usePageTitle(): sets the browser tab title for the current page.
import { useEffect } from 'react'
import { APP_NAME, APP_TAGLINE } from '@/config/app'

/** Sets the browser tab title: usePageTitle('Products') -> "Products · Inventra" */
export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${APP_NAME}` : `${APP_NAME} · ${APP_TAGLINE}`
  }, [title])
}
