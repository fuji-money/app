import Cookies from 'cookies'

export const hashEmail = (email: string) => `${email}/hashed` // TODO

export const setCookie = (email: string, req: any, res: any) => {
  const cookies = new Cookies(req, res)
  cookies.set('myCookieName', hashEmail, {
    httpOnly: true // true by default
  })
}