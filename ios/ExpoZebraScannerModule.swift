import ExpoModulesCore

public class ExpoZebraScannerModule: Module {
  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  public func definition() -> ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
    // The module will be accessible from `requireNativeModule('ExpoZebraScanner')` in JavaScript.
    Name("ExpoZebraScanner")

    // Defines a JavaScript synchronous function that runs the native code on the JavaScript thread.
    Function("hello") {
      return "Hello world! 👋"
    }

    Function("startScan") {
      return "ExpoZebraScanner not available on IOS."
    }
    Function("stopScan") {
      return "ExpoZebraScanner not available on IOS."
    }

    Function("sendBroadcast") { (bundle: [String: Any]) -> String in
      return "ExpoZebraScanner not available on IOS."
    }

    Function("startCustomScan") { (action: String) -> String in
      return "ExpoZebraScanner not available on IOS."
    }

    Function("stopCustomScan") {
      return "ExpoZebraScanner not available on IOS."
    }

    AsyncFunction("getDataWedgeVersion") { () -> [Int] in
      return [0, 0, 0]
    }

  }
}
