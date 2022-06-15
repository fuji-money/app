interface ContractsHeaderProps {
  showActive: boolean
  setShowActive: any
}

const ContractsHeader = ({
  showActive,
  setShowActive,
}: ContractsHeaderProps) => {
  const isActiveSelected = (bool: boolean): string | undefined => {
    if (showActive === bool) return 'selected'
    return
  }

  return (
    <div className="header level mb-4">
      <div className="level-left">
        <div className="level-item">
          <h2>Contracts</h2>
        </div>
      </div>
      <div className="level-right">
        <div className="level-item">
          <p className="has-text-weight-bold">Show:</p>
          <p className="ml-3">
            <a
              className={isActiveSelected(true)}
              onClick={() => setShowActive(true)}
            >
              Active
            </a>
            &nbsp;|&nbsp;
            <a
              className={isActiveSelected(false)}
              onClick={() => setShowActive(false)}
            >
              Expired
            </a>
          </p>
        </div>
      </div>
      <style jsx>{`
        a {
          color: #636363;
        }
        a.selected {
          color: #dc3768;
          font-weight: 700;
        }
      `}</style>
    </div>
  )
}

export default ContractsHeader
