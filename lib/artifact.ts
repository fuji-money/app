import artifactJSON from 'lib/fuji.ionio.json'
import {
  Artifact,
  replaceArtifactConstructorWithArguments,
  templateString,
} from '@ionio-lang/ionio'

export const artifact: Artifact = replaceArtifactConstructorWithArguments(
  artifactJSON as Artifact,
  artifactJSON.constructorInputs.map((ci) => {
    const newName = ci.name === 'borrowerPublicKey' ? 'fuji' : ci.name
    return templateString(newName)
  }),
)
