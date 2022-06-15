interface ReviewOrderButtonProps {}

const ReviewOrderButton = ({}: ReviewOrderButtonProps) => {
  const enabled = true

  return (
    <div className="has-text-centered">
      <button className="button is-primary" disabled={!enabled}>
        Review order
      </button>
    </div>
  )
}

export default ReviewOrderButton
