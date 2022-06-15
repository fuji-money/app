interface SnippetProps {
  title: string
  value: string
  after: string
}

const Snippet = ({ title, value, after }: SnippetProps) => {
  return (
    <div>
      <p className="is-size-7 is-grey">{title}</p>
      <p className="is-gradient">{value}</p>
      <span className="is-after">{after}</span>
    </div>
  )
}

export default Snippet
