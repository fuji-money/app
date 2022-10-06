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
  channel?: string
  title: string
}

const Title = ({ channel, title }: TitleProps) => {
  return (
    <h1>
      {title}
      {channel && <Icon channel={channel} />}
    </h1>
  )
}

export default Title
