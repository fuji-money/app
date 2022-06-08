const ExchangeOverview = () => {
  const box = (left: string, right: string) => (
    <div className="is-box level is-size-7 mb-1">
      <div className='level-left'>
        <p className='ml-2'>{left}</p>
      </div>
      <div className='level-right'>
        <p className="has-text-weight-bold">{right}</p>
      </div>
    </div>
  )

  return (
    <>
      <h3 className="mt-6 is-purple">Investments</h3>
      {box('Total holding', 'US$ 450.000')}
      {box('Value of holding', 'US$ 45.000')}
      {box('Total return', 'US$ 40.000')}

      <h3 className="mt-6 is-purple">Stats</h3>
      {box('Market cap', 'US$ 450.000')}
      {box('Circulating suply', 'US$ 45.000')}
      {box('Max supply', 'US$ 40.000')}
    </>
  )
}

export default ExchangeOverview
