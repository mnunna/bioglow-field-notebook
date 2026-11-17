const { withPodfile, withXcodeProject } = require('@expo/config-plugins');

const MARKER = '# BioGlow: keep every CocoaPods target compatible with current Xcode';
const PATH_MARKER = '# BioGlow: quote the Expo Constants script when the project path has spaces';
const WARNINGS_MARKER = '# BioGlow: keep third-party warnings out of the app build';

module.exports = function withIosDeploymentTarget(config) {
  let nextConfig = withPodfile(config, (podfileConfig) => {
    let podfile = podfileConfig.modResults.contents;

    if (!podfile.includes(WARNINGS_MARKER)) {
      const prepareProject = 'prepare_react_native_project!';

      if (!podfile.includes(prepareProject)) {
        throw new Error('Could not configure CocoaPods warning handling.');
      }

      podfile = podfile.replace(
        prepareProject,
        `${prepareProject}\n\n${WARNINGS_MARKER}\ninhibit_all_warnings!`,
      );
    }

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
        build_config.build_settings['OTHER_LIBTOOLFLAGS'] =
          '$(inherited) -no_warning_for_no_symbols'
      end

      if target.name == 'hermes-engine'
        target.shell_script_build_phases.each do |phase|
          next unless phase.name == '[CP-User] [Hermes] Replace Hermes for the right configuration, if needed'

          phase.always_out_of_date = '1'
        end
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

    if (additions.length === 0 && podfile === podfileConfig.modResults.contents) {
      return podfileConfig;
    }

    podfileConfig.modResults.contents =
      podfile.slice(0, insertionPoint) +
      additions.join('') +
      podfile.slice(insertionPoint);

    return podfileConfig;
  });

  nextConfig = withXcodeProject(nextConfig, (xcodeConfig) => {
    const targetName = xcodeConfig.modRequest.projectName;

    if (!targetName) {
      throw new Error('Could not determine the generated iOS target name.');
    }

    xcodeConfig.modResults.updateBuildProperty(
      'ENABLE_USER_SCRIPT_SANDBOXING',
      'NO',
      undefined,
      targetName,
    );
    xcodeConfig.modResults.updateBuildProperty(
      'OTHER_SWIFT_FLAGS',
      '"$(inherited) -D EXPO_CONFIGURATION_DEBUG -Xcc -Wno-incomplete-umbrella -Xcc -Wno-nullability-completeness"',
      'Debug',
      targetName,
    );
    xcodeConfig.modResults.updateBuildProperty(
      'OTHER_SWIFT_FLAGS',
      '"$(inherited) -D EXPO_CONFIGURATION_RELEASE -Xcc -Wno-incomplete-umbrella -Xcc -Wno-nullability-completeness"',
      'Release',
      targetName,
    );

    const phases = xcodeConfig.modResults.hash.project.objects.PBXShellScriptBuildPhase;
    const legacyCommand =
      '`\\"$NODE_BINARY\\" --print \\"require(\'path\').dirname(require.resolve(\'react-native/package.json\')) + \'/scripts/react-native-xcode.sh\'\\"`';
    const pathSafeCommand =
      'REACT_NATIVE_XCODE_SCRIPT=\\"$(\\"$NODE_BINARY\\" --print \\"require(\'path\').dirname(require.resolve(\'react-native/package.json\')) + \'/scripts/react-native-xcode.sh\'\\")\\"\\n\\"$REACT_NATIVE_XCODE_SCRIPT\\"';
    const wrapperCommand = '\\"$PROJECT_ROOT/scripts/run-react-native-xcode.sh\\"';

    for (const phase of Object.values(phases)) {
      if (phase?.name !== '"Bundle React Native code and images"') continue;

      if (phase.shellScript?.includes(legacyCommand)) {
        phase.shellScript = phase.shellScript.replace(legacyCommand, wrapperCommand);
      } else if (phase.shellScript?.includes(pathSafeCommand)) {
        phase.shellScript = phase.shellScript.replace(pathSafeCommand, wrapperCommand);
      }
    }

    return xcodeConfig;
  });

  return nextConfig;
};
