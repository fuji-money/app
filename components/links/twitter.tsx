interface TwitterLinkProps {
  message: string
}

const TwitterLink = ({ message }: TwitterLinkProps) => {
  const href = `http://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`
  return (
    <a href={href} className="button external" target="_blank" rel="noreferrer">
      Twit this
      <style jsx>{`
        a.external {
          border: 0;
        }
      `}</style>
    </a>
  )
}

export default TwitterLink