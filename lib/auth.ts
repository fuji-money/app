import crypto from 'crypto'

const separator = '#'
const secret = process.env.ENCRYPTION_SECRET
const cookieName = 'fujiauth'

const hashEmail = (email: string) =>
  crypto
    .createHash('sha256')
    .update(email + secret)
    .digest()
    .toString('hex')

export const calcAuthCookie = (email: string) =>
  cookieName + '=' + email + separator + hashEmail(email)

export const setAuthCookie = (cookie: string, expDays = 30) => {
  const date = new Date()
  date.setTime(date.getTime() + expDays * 24 * 60 * 60 * 1000)
  const expires = 'expires=' + date.toUTCString()
  document.cookie = cookie + '; ' + expires + '; path=/'
}

export const deleteAuthCookie = () => setAuthCookie('', -1)

export const checkAuthCookie = (cookie: string) => {
  const [name, value] = cookie.split('=')
  const [email, hash] = value.split(separator)
  return name === cookieName && hash === hashEmail(email)
}

export const userNotAllowed = (cookies: string) =>
  !cookies.split('; ').find((cookie) => checkAuthCookie(cookie))
