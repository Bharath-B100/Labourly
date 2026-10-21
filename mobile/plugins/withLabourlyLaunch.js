const {
  withAndroidStyles,
  withAndroidColors,
  withDangerousMod,
  AndroidConfig,
} = require('expo/config-plugins');
const fs = require('node:fs/promises');
const path = require('node:path');

// Native branding only. Package IDs, activities and database behavior stay intact.
module.exports = function withLabourlyLaunch(config) {
  config = withAndroidColors(config, (config) => {
    for (const [name, value] of Object.entries({
      colorPrimary: '#FFCC25',
      splashscreen_background: '#FFFFFF',
      iconBackground: '#FFFFFF',
    })) {
      config.modResults = AndroidConfig.Colors.assignColorValue(
        config.modResults,
        { name, value },
      );
    }
    return config;
  });
  config = withAndroidStyles(config, (config) => {
    for (const [name, value] of Object.entries({
      'android:windowBackground': '@drawable/labourly_launch',
      'android:windowSplashScreenBackground': '#FFFFFF',
      'android:windowSplashScreenAnimatedIcon': '@drawable/labourly_mark',
      'android:windowLightStatusBar': 'true',
      'android:windowLightNavigationBar': 'true',
    })) {
      config.modResults = AndroidConfig.Styles.assignStylesValue(
        config.modResults,
        { add: true, name, value, parent: { name: 'Theme.App.SplashScreen' } },
      );
    }
    return config;
  });
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const folder = path.join(
        config.modRequest.platformProjectRoot,
        'app/src/main/res/drawable',
      );
      await fs.mkdir(folder, { recursive: true });
      const bitmaps = path.join(folder, '../drawable-nodpi');
      await fs.mkdir(bitmaps, { recursive: true });
      await fs.copyFile(
        path.join(
          config.modRequest.projectRoot,
          'assets/labourly/hardhat-mark.png',
        ),
        path.join(bitmaps, 'labourly_brand_icon.png'),
      );
      await fs.writeFile(
        path.join(folder, 'labourly_mark.xml'),
        '<layer-list xmlns:android="http://schemas.android.com/apk/res/android"><item android:width="160dp" android:height="160dp" android:gravity="center"><bitmap android:src="@drawable/labourly_brand_icon" android:gravity="fill"/></item></layer-list>',
      );
      await fs.writeFile(
        path.join(folder, 'labourly_launch.xml'),
        '<layer-list xmlns:android="http://schemas.android.com/apk/res/android"><item android:drawable="@android:color/white"/><item android:width="160dp" android:height="160dp" android:gravity="center" android:drawable="@drawable/labourly_mark"/></layer-list>',
      );
      return config;
    },
  ]);
};
