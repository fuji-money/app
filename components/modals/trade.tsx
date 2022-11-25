import Image from 'next/image'
import Modal, { ModalIds } from './modal'

const TradeModal = () => {
  return (
    <Modal id={ModalIds.Trade}>
      <h3 className="mb-5">Trade</h3>
      <p className="is-size-7 mb-5">
        FUJI assets are available for trade in the following venues
      </p>
      <div className="is-flex is-justify-content-center box-container">
        <div>
          <a href="https://tdex.network">
            <p>
              <Image
                src="/images/trade/tdex.svg"
                alt="TDEX logo"
                height={40}
                width={40}
              />
            </p>
            <p>TDEX</p>
          </a>
        </div>
        <div>
          <a href="https://beta.bitmatrix.app">
            <p>
              <Image
                src="/images/trade/bitmatrix.svg"
                alt="Bitmatrix logo"
                height={40}
                width={40}
              />
            </p>
            <p>Bitmatrix</p>
          </a>
        </div>
        {/* <div>
          <a href="https://dex.vulpem.com/">
            <p>
              <Image
                src="/images/trade/vulpem.svg"
                alt="Vulpem logo"
                height={40}
                width={40}
              />
            </p>
            <p>Vulpem</p>
          </a>
        </div> */}
      </div>
      <style jsx>{`
        div.box-container > div {
          aspect-ratio: 1/1;
          background-color: white;
          border: 1px solid #6b1d9c;
          border-radius: 5px;
          margin: 1rem;
          padding: 1rem;
          width: 100px;
        }
        div.box-container > div p {
          color: #6b1d9c;
          font-size: 0.6rem;
          font-weight: 700;
        }
      `}</style>
    </Modal>
  )
}

export default TradeModal
