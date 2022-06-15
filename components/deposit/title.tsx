import { useEffect, useState } from 'react'
import Image from 'next/image'

interface IconProps {
  network: string
}

const Icon = ({ network }: IconProps) => {
  const alt = `${network} logo`
  const src = `/images/networks/${network}.svg`
  return (
    <span>
      <Image src={src} alt={alt} height={30} width={30} />
      <style jsx>{`
        span {
          position: relative;
          left: 10px;
          top: 8px;
        }
      `}</style>
    </span>
  )
}

interface TitleProps {
  name: string
  network: string
  deposit: boolean
}

const Title = ({ name, network, deposit }: TitleProps) => {
  const [title, setTitle] = useState(name)

  useEffect(() => {
    const _title = !deposit
      ? name
      : !network
      ? 'Select deposit method'
      : network === 'lightning'
      ? 'Deposit via Lightning'
      : 'Deposit via Liquid Network'
    setTitle(_title)
  }, [name, network, deposit])

  return (
    <h1>
      {title}
      {network && <Icon network={network} />}
    </h1>
  )
}

export default Title
