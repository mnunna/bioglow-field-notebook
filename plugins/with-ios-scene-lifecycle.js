const { withAppDelegate, withInfoPlist } = require('@expo/config-plugins');

const MARKER = '// BioGlow: iOS 27 scene lifecycle';

const SCENE_DELEGATE = `

${MARKER}
@objc(SceneDelegate)
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard
      let windowScene = scene as? UIWindowScene,
      let appDelegate = UIApplication.shared.delegate as? AppDelegate,
      let factory = appDelegate.reactNativeFactory
    else {
      return
    }

    let window = UIWindow(windowScene: windowScene)
    self.window = window
    appDelegate.window = window

    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: appDelegate.launchOptions)
  }
}
`;

function withSceneAppDelegate(config) {
  return withAppDelegate(config, (appDelegateConfig) => {
    let contents = appDelegateConfig.modResults.contents;

    if (contents.includes(MARKER)) {
      return appDelegateConfig;
    }

    const windowProperty = '  var window: UIWindow?\n';
    const startupBlock = /#if os\(iOS\) \|\| os\(tvOS\)\n\s*window = UIWindow\(frame: UIScreen\.main\.bounds\)\n\s*factory\.startReactNative\([\s\S]*?\)\n#endif/;

    if (!contents.includes(windowProperty) || !startupBlock.test(contents)) {
      throw new Error(
        'Could not update AppDelegate.swift for the iOS 27 scene lifecycle.',
      );
    }

    contents = contents
      .replace(
        windowProperty,
        `${windowProperty}  var launchOptions: [UIApplication.LaunchOptionsKey: Any]?\n`,
      )
      .replace(startupBlock, '    self.launchOptions = launchOptions');

    appDelegateConfig.modResults.contents = contents + SCENE_DELEGATE;
    return appDelegateConfig;
  });
}

function withSceneManifest(config) {
  return withInfoPlist(config, (infoPlistConfig) => {
    infoPlistConfig.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: 'Default Configuration',
            UISceneDelegateClassName: '$(PRODUCT_MODULE_NAME).SceneDelegate',
          },
        ],
      },
    };

    return infoPlistConfig;
  });
}

module.exports = function withIosSceneLifecycle(config) {
  return withSceneManifest(withSceneAppDelegate(config));
};
