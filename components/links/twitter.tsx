interface TwitterLinkProps {
  message: string
}

const TwitterLink = ({ message }: TwitterLinkProps) => {
  const href = `http://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`
  return (
    <a href={href} className="button external" target="_blank" rel="noreferrer">
      🐦 Share on Twitter
    </a>
  )
}

export default TwitterLink