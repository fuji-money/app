import { useEffect, useState } from 'react'
import Image from 'next/image'

interface IconProps {
  channel: string
}

const Icon = ({ channel }: IconProps) => {
  const alt = `${channel} logo`
  const src = `/images/networks/${channel}.svg`
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
  channel: string
  deposit: boolean
}

const Title = ({ name, channel, deposit }: TitleProps) => {
  const [title, setTitle] = useState(name)

  useEffect(() => {
    const _title = !deposit
      ? name
      : !channel
      ? 'Select deposit method'
      : channel === 'lightning'
      ? 'Deposit via Lightning'
      : 'Deposit via Liquid Network'
    setTitle(_title)
  }, [name, channel, deposit])

  return (
    <h1>
      {title}
      {channel && <Icon channel={channel} />}
    </h1>
  )
}

export default Title
