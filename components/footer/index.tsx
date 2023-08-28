const artifactRepositoryURL = 'https://github.com/fuji-money/tapscripts'

const Footer = () => (
  <footer>
    <p>
      Covenant artifact fetched from{' '}
      <a href={artifactRepositoryURL}>{artifactRepositoryURL}</a>
    </p>
    <style jsx>{`
      p {
        background-color: #6b1d9c;
        color: white;
        font-size: 0.8rem;
        font-weight: 700;
        margin-bottom: 0;
        padding: 1em;
        text-align: center;
      }
      a {
        color: white;
        text-decoration: underline;
      }
    `}</style>
  </footer>
)

export default Footer
