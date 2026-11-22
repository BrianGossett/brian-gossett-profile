// Generates the Android (Trusted Web Activity) project from the live site's manifest.
const { TwaManifest, TwaGenerator, ConsoleLog } = require('@bubblewrap/core')
const path = require('path')

async function main() {
  const target = path.resolve(process.argv[2])
  const twa = await TwaManifest.fromWebManifest('https://briangossett.org/manifest.webmanifest')
  twa.packageId = 'org.briangossett.app'
  twa.name = 'BG To-do'
  twa.launcherName = 'BG To-do'
  twa.startUrl = '/todo'
  twa.appVersionCode = 1
  twa.appVersionName = '1.0.0'
  twa.signingKey = { path: './bg-todo.keystore', alias: 'bg-todo' }
  twa.minSdkVersion = 24 // Android 7: the lowest the browser-helper library supports
  twa.enableNotifications = false
  twa.generatorApp = 'bubblewrap-core'
  const problem = twa.validate()
  if (problem) throw new Error(problem)
  await twa.saveToFile(path.join(target, 'twa-manifest.json'))
  await new TwaGenerator().createTwaProject(target, twa, new ConsoleLog('generate'))
  console.log(JSON.stringify({ host: twa.host, startUrl: twa.startUrl, packageId: twa.packageId, minSdk: twa.minSdkVersion }, null, 1))
}
main().catch(err => { console.error(err); process.exit(1) })
