import artifactJSON from 'lib/fuji.ionio.json'
import {
  Artifact,
  replaceArtifactConstructorWithArguments,
  templateString,
} from '@ionio-lang/ionio'
import { fetchURL } from './fetch'

export const artifact: Artifact = replaceArtifactConstructorWithArguments(
  artifactJSON as Artifact,
  artifactJSON.constructorInputs.map((ci) => {
    const newName = ci.name === 'borrowerPublicKey' ? 'fuji' : ci.name
    return templateString(newName)
  }),
)

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
