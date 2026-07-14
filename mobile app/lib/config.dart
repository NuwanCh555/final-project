import 'dart:io';

class AppConfig {
  // 1. Set to 'true' if testing on a physical Android device connected via USB with 'adb reverse tcp:5000 tcp:5000'.
  // 2. Set to 'false' if running on a standard Android Emulator.
  static const bool usePhysicalDeviceWithAdbReverse = false;

  // 3. Alternatively, if testing on Wi-Fi, enter your computer's local IP (e.g. '192.168.1.100').
  // Keep it null or empty to use localhost / 10.0.2.2.
  static const String localComputerIp = '172.20.56.146';

  static String get baseUrl {
    if (localComputerIp.isNotEmpty) {
      return 'http://$localComputerIp:5000/api';
    }

    try {
      if (Platform.isAndroid) {
        if (usePhysicalDeviceWithAdbReverse) {
          return 'http://localhost:5000/api';
        }
        return 'http://10.0.2.2:5000/api';
      }
    } catch (_) {
      // Fallback for web or desktop environments where Platform is not supported/needed
    }
    // Default localhost for iOS Simulator or desktop testing
    return 'http://localhost:5000/api';
  }
}
