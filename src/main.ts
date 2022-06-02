import csvparse from 'csv-parse/lib/sync'
import * as core from '@actions/core'
import * as exec from '@actions/exec'

async function run(): Promise<void> {
  try {
    const source:string[] = await getDestinationTags()
    const dockerConfigPath: string =
      core.getInput('docker-config-path') || '/home/runner/.docker/config.json'

    const destination: string = core.getInput('dst')  

    if (destination === '') {
      core.setFailed('Destaination image not set')
      return
    }

    if (source.length === 0) {
      core.setFailed('Source image not set')
      return
    }


    await exec.exec('docker', [
      'run',
      '--rm',
      '-i',
      '-v',
      '--privileged',
      `${dockerConfigPath}:/root/.docker/config.json`,
      '--network',
      'host',
      'quay.io/skopeo/stable:latest',
      ...source,
      destination
    ])
  } catch (error: any) {
    core.setFailed(error.message)
  }
}

// This function is a modified version from the script used in docker buildx actions
// Ref https://github.com/docker/build-push-action/blob/master/src/context.ts#L163
export async function getDestinationTags(): Promise<string[]> {
  const res: string[] = []

  const items = core.getInput('src')
  if (items === '') {
    return res
  }

  for (const output of (await csvparse(items, {
    columns: false,
    relaxColumnCount: true,
    skipLinesWithEmptyValues: true
  })) as string[][]) {
    if (output.length === 1) {
      res.push(output[0])
    } else {
      res.push(...output)
    }
  }

  return res.filter(item => item).map(pat => pat.trim())
}

run()
