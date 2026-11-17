const { withPodfile, withXcodeProject } = require('@expo/config-plugins');

const MARKER = '# BioGlow: keep every CocoaPods target compatible with current Xcode';
const PATH_MARKER = '# BioGlow: quote the Expo Constants script when the project path has spaces';

module.exports = function withIosDeploymentTarget(config) {
  let nextConfig = withPodfile(config, (podfileConfig) => {
    const podfile = podfileConfig.modResults.contents;

    const postInstallEnd = '\n  end\nend\n';
    const insertionPoint = podfile.lastIndexOf(postInstallEnd);

    if (insertionPoint === -1) {
      throw new Error('Could not find the CocoaPods post_install block.');
    }

    const additions = [];

    if (!podfile.includes(MARKER)) {
      additions.push(`

    ${MARKER}
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |build_config|
        build_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] =
          podfile_properties['ios.deploymentTarget'] || '17.0'
      end
    end`);
    }

    if (!podfile.includes(PATH_MARKER)) {
      additions.push(`

    ${PATH_MARKER}
    installer.pods_project.targets.each do |target|
      next unless target.name == 'EXConstants'

      target.shell_script_build_phases.each do |phase|
        next unless phase.name == '[CP-User] Generate app.config for prebuilt Constants.manifest'

        phase.shell_script = %q{bash -l -c '"$PODS_TARGET_SRCROOT/../scripts/get-app-config-ios.sh"'}
      end
    end`);
    }

    if (additions.length === 0) {
      return podfileConfig;
    }

    podfileConfig.modResults.contents =
      podfile.slice(0, insertionPoint) +
      additions.join('') +
      podfile.slice(insertionPoint);

    return podfileConfig;
  });

  nextConfig = withXcodeProject(nextConfig, (xcodeConfig) => {
    xcodeConfig.modResults.updateBuildProperty(
      'ENABLE_USER_SCRIPT_SANDBOXING',
      'NO',
      undefined,
      'BioGlowFieldNotebook',
    );

    const phases = xcodeConfig.modResults.hash.project.objects.PBXShellScriptBuildPhase;
    const oldCommand =
      '`\\"$NODE_BINARY\\" --print \\"require(\'path\').dirname(require.resolve(\'react-native/package.json\')) + \'/scripts/react-native-xcode.sh\'\\"`';
    const newCommand =
      'REACT_NATIVE_XCODE_SCRIPT=\\"$(\\"$NODE_BINARY\\" --print \\"require(\'path\').dirname(require.resolve(\'react-native/package.json\')) + \'/scripts/react-native-xcode.sh\'\\")\\"\\n\\"$REACT_NATIVE_XCODE_SCRIPT\\"';

    for (const phase of Object.values(phases)) {
      if (
        phase?.name === '"Bundle React Native code and images"' &&
        phase.shellScript?.includes(oldCommand)
      ) {
        phase.shellScript = phase.shellScript.replace(oldCommand, newCommand);
      }
    }

    return xcodeConfig;
  });

  return nextConfig;
};
