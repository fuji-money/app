import Link from 'next/link'
import { useRouter } from 'next/router'

const Breadcrumbs = () => {
  let href: string[] = []
  const { asPath } = useRouter()
  const steps = asPath
    .substring(1)
    .split('/')
    .filter((step) => step.length < 32)
    .map((step) => {
      href.push(step)
      return {
        name: step,
        href: '/' + href.join('/'),
      }
    })
  return (
    <nav className="breadcrumb is-small my-5" aria-label="breadcrumbs">
      <ul>
        {steps &&
          steps.map(({ href, name }, index) => (
            <li key={index}>
              <Link href={href}>
                <a className="px-2">{name}</a>
              </Link>
            </li>
          ))}
      </ul>
      <style jsx>{`
        li a {
          text-transform: capitalize;
        }
        li::before {
          color: hsl(0deg, 0%, 71%);
          content: '/';
        }
      `}</style>
    </nav>
  )
}

export default Breadcrumbs
