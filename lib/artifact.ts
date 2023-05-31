import {
  Artifact,
  replaceArtifactConstructorWithArguments,
  templateString,
} from '@ionio-lang/ionio'
import { fetchURL } from './fetch'

export const getArtifact = async (): Promise<Artifact> => {
  const artifactJSON = await fetchURL(
    'https://raw.githubusercontent.com/fuji-money/tapscripts/main/artifacts/alpha/fuji.ionio.json',
  )
  return replaceArtifactConstructorWithArguments(
    artifactJSON as Artifact,
    artifactJSON.constructorInputs.map((ci: any) => {
      const newName = ci.name === 'borrowerPublicKey' ? 'fuji' : ci.name
      return templateString(newName)
    }),
  )
}
