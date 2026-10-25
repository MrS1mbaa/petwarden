// Signs release builds with ~/.petwarden/keystore.properties; without that file it falls back to the debug key.
const { withAppBuildGradle } = require('expo/config-plugins');
module.exports = config => withAppBuildGradle(config, cfg => {
  let g = cfg.modResults.contents;
  if (g.includes('releasePropsFile')) return cfg;
  const swap = (from, to) => { if (!g.includes(from)) throw new Error(`withReleaseSigning: template changed, missing: ${from}`); g = g.replace(from, to); };
  swap('android {', `def releasePropsFile = new File(System.getProperty('user.home'), '.petwarden/keystore.properties')
def releaseProps = new Properties()
if (releasePropsFile.exists()) releasePropsFile.withInputStream { releaseProps.load(it) }
android {`);
  swap('    signingConfigs {\n', `    signingConfigs {
        release {
            if (releasePropsFile.exists()) {
                storeFile file(releaseProps.storeFile)
                storePassword releaseProps.storePassword
                keyAlias releaseProps.keyAlias
                keyPassword releaseProps.keyPassword
            }
        }
`);
  swap('            signingConfig signingConfigs.debug\n            def enableShrinkResources', '            signingConfig releasePropsFile.exists() ? signingConfigs.release : signingConfigs.debug\n            def enableShrinkResources');
  cfg.modResults.contents = g;
  return cfg;
});
