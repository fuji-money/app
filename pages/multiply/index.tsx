import MultiplyOffer from 'components/multiply/offer'
import type { NextPage } from 'next'

const MultiplyPage: NextPage = () => {
  return (
    <section>
      <h1>FUJI Multiply</h1>
      <p className="is-size-7 mt-6">
        In vivamus mi pretium pharetra cursus lacus, elit. Adipiscing eget vel
        ut non duis vitae. Augue mi, bibendum ac imperdiet ipsum sed ornare.
        Facilisis id sem quam elementum euismod ante ut. Ac, pharetra elit, sit
        pharetra a. Eu diam nunc nulla risus arcu, integer nulla diam, est. Nisl
        accumsan potenti mattis consectetur pellentesque.
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
