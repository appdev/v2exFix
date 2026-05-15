import { isArray } from 'lodash-es'

export function clearCookie() {
  if (typeof document === 'undefined') return Promise.resolve()

  document.cookie.split(';').forEach(cookie => {
    const name = cookie.split('=')[0]?.trim()
    if (!name) return
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
  })

  return Promise.resolve()
}

export function setCookie(cookies: string[] | string) {
  if (typeof document === 'undefined') return Promise.resolve()

  const cookieList = isArray(cookies) ? cookies : [cookies]
  cookieList.forEach(cookie => {
    document.cookie = cookie
  })

  return Promise.resolve()
}

export async function getCookie(): Promise<string> {
  if (typeof document === 'undefined') return ''
  return document.cookie
}
