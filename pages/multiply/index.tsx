import MultiplyOffer from 'components/multiply/offer'
import type { NextPage } from 'next'

const MultiplyPage: NextPage = () => {
  return (
    <section>
      <h1>Multiply</h1>
      <p className="is-size-12 mt-6 has-text-centered">
        Multiply your exposure to your Bitcoin and other digital assets. Browse our available products below.
      </p>
      <MultiplyOffer />
      <style jsx>{`
        .is-box {
          max-width: 400px;
        }
        .icon-container {
          margin-bottom: -10px;
          position: relative;
          top: -42px;
        }
        .button {
          min-width: 100%;
        }
      `}</style>
    </section>
  )
}

export default MultiplyPage
