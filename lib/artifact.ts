import {
  Artifact,
  replaceArtifactConstructorWithArguments,
  templateString,
} from '@ionio-lang/ionio'
import { fetchURL } from './fetch'
import { artifactJSONurl } from './constants'

export const getArtifact = async (): Promise<Artifact> => {
  const artifactJSON = await fetchURL(artifactJSONurl)
  return replaceArtifactConstructorWithArguments(
    artifactJSON as Artifact,
    artifactJSON.constructorInputs.map((ci: any) => {
      const newName = ci.name === 'borrowerPublicKey' ? 'fuji' : ci.name
      return templateString(newName)
    }),
  )
}
