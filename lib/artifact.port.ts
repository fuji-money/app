import { Artifact } from '@ionio-lang/ionio'
import { Octokit as BaseOctokit } from '@octokit/rest'
import { throttling } from '@octokit/plugin-throttling'

const Octokit = BaseOctokit.plugin(throttling)

export interface ArtifactRepository {
  getLatest(): Promise<Artifact>
  get(timestamp: number): Promise<Artifact>
}

type GitRepository = {
  owner: string
  repo: string
  branch: string
}

export class GitArtifactRepository implements ArtifactRepository {
  static ARTIFACT_PATH = '/artifacts/alpha/fuji.ionio.json'

  private readonly client: BaseOctokit['rest']

  constructor(private repository: GitRepository) {
    this.client = new Octokit({
      throttle: {
        onRateLimit: (_, __, ___, retryCount) => {
          if (retryCount < 2) {
            return true
          }
        },
        onSecondaryRateLimit: (_, options, octokit) => {
          // does not retry, only logs a warning
          octokit.log.warn(
            `SecondaryRateLimit detected for request ${
              (options as any)['url']
            }`,
          )
        },
      },
    }).rest
  }

  getLatest(): Promise<Artifact> {
    return this.get(Date.now())
  }

  // find the commit that is closest to the given timestamp modifying the artifact file

  async get(timestamp: number): Promise<Artifact> {
    const until = new Date(timestamp).toISOString()

    const commits = await this.client.repos.listCommits({
      ...this.repository,
      until,
      path: GitArtifactRepository.ARTIFACT_PATH,
    })

    if (!commits.data.length)
      throw new Error(`No commits found until the given timestamp ${until}`)

    // get the closest commit to the given timestamp
    const commit = commits.data.reduce((prev, curr) => {
      const time = prev.commit.committer?.date || prev.commit.author?.date
      if (!time) return curr
      const prevDate = new Date(time)
      const currTime = curr.commit.committer?.date || curr.commit.author?.date
      if (!currTime) return prev
      const currDate = new Date(currTime)
      return Math.abs(currDate.getTime() - timestamp) <
        Math.abs(prevDate.getTime() - timestamp)
        ? curr
        : prev
    })

    // fetch artifact file
    const artifact = await this.client.repos.getContent({
      ...this.repository,
      ref: commit.sha,
      path: GitArtifactRepository.ARTIFACT_PATH,
    })

    if (!isArtifactContentResponse(artifact.data))
      throw new Error(
        `Invalid artifact content response: ${JSON.stringify(artifact.data)}`,
      )
    const contentJSON = JSON.parse(
      Buffer.from(artifact.data.content, artifact.data.encoding).toString(
        'utf-8',
      ),
    )
    return contentJSON
  }
}

interface ArtifactContentResponse {
  content: string
  encoding: 'base64'
}

// type guard for artifact content response from octokit API
function isArtifactContentResponse(obj: any): obj is ArtifactContentResponse {
  return (
    obj.type === 'file' &&
    obj.content &&
    typeof obj.content === 'string' &&
    obj.encoding === 'base64'
  )
}
