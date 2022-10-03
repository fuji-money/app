import Link from 'next/link'
import { useRouter } from 'next/router'

type Step = {
  name: string
  href: string
}

const Breadcrumbs = () => {
  const href: string[] = []
  const steps: Step[] = []
  const { asPath } = useRouter()
  for (const item of asPath.substring(1).split('/')) {
    href.push(item)
    if (item.length < 32) {
      steps.push({
        name: item,
        href: '/' + href.join('/'),
      })
    }
  }
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
