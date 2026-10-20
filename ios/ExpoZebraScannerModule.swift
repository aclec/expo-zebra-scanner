import ExpoModulesCore

// Zebra DataWedge is Android-only. On iOS the JS layer never calls this module: it swaps in a
// stub that warns once in dev and no-ops (src/internal/unsupportedPlatformModule.ts). This
// placeholder keeps the same API shape so the native module registry stays consistent.
public class ExpoZebraScannerModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoZebraScanner")
    Events("onBarcodeScanned", "onCustomScan")

    Function("startScan") {}
    Function("stopScan") {}
    Function("sendBroadcast") { (_: [String: Any]) in }
    Function("startCustomScan") { (_: String) in }
    Function("stopCustomScan") {}
    Function("stopCustomScanForAction") { (_: String) in }

    AsyncFunction("getDataWedgeVersion") { () -> [Int] in
      return [0, 0, 0]
    }
  }
}
