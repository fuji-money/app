import Image from 'next/image'

const ExchangeTransactions = () => {
  const transactions = [
    {
      date: 'Feb 2',
      txs: [
        {
          description: 'From Metalo-Cashback',
          icon: '/images/icons/vulpem.png',
          value: 0.00123,
        },
        {
          description: 'Send to Euro',
          icon: '/images/icons/vulpem.png',
          value: -0.00321,
        }
      ]
    },
    {
      date: 'Feb 1',
      txs: [
        {
          description: 'Send to Euro',
          icon: '/images/icons/vulpem.png',
          value: -0.042,
        },
        {
          description: 'From Metalo-Cashback',
          icon: '/images/icons/vulpem.png',
          value: 0.00333,
        },
      ]
    },
    {
      date: 'Jan 30',
      txs: [
        {
          description: 'Send to Euro',
          icon: '/images/icons/vulpem.png',
          value: -0.042,
        },
        {
          description: 'From Metalo-Cashback',
          icon: '/images/icons/vulpem.png',
          value: 0.00333,
        },
      ]
    }
  ]

  return (
    <>
      {transactions.map((day, index) => {
        return (
          <>
            <h3 key={index} className="mt-6 is-purple">{day.date}</h3>
            {day.txs.map((tx, index) => {
              const prefix = `${tx.value > 0 ? '+' : ''}`
              return (
                <div key={index} className="is-box level is-size-7 mb-1">
                  <div className='level-left'>
                    <Image
                      src={tx.icon}
                      alt='transaction logo'
                      height={20}
                      width={20}
                    />
                    <p className='ml-2'>{tx.description}</p>
                  </div>
                  <div className='level-right'>
                    <p className="has-text-weight-bold">{prefix} {tx.value} fBMN</p>
                  </div>
                </div>
              )
            })}
          </>
        )
      })}
    </>
  )
}

export default ExchangeTransactions
