package expo.modules.zebrascanner

import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoZebraScannerModule : Module() {

  private val receiverController by lazy { ReceiverController(::sendEvent) }

  override fun definition() = ModuleDefinition {
    Name("ExpoZebraScanner")
    Events(EVENT_BARCODE_SCANNED, EVENT_CUSTOM_SCAN)

    Function("startScan") {
      val ctx = appContext.reactContext ?: return@Function null
      receiverController.startBarcodeScan(ctx)
    }

    Function("stopScan") {
      val ctx = appContext.reactContext ?: return@Function null
      receiverController.stopBarcodeScan(ctx)
    }

    // Ported from https://github.com/darryncampbell/react-native-datawedge-intents
    // Credits to @darryncampbell
    Function("sendBroadcast") { payload: Map<String, Any?> ->
      val ctx = appContext.reactContext ?: return@Function null
      val intent = buildBroadcastIntent(payload)
      if (intent.action.isNullOrBlank()) return@Function null
      try {
        ctx.sendBroadcast(intent)
      } catch (_: Throwable) {
        // Ignore invalid broadcast payloads to avoid crashing the JS caller.
      }
    }

    Function("startCustomScan") { action: String ->
      val ctx = appContext.reactContext ?: return@Function null
      receiverController.startCustomScan(ctx, action)
    }

    Function("stopCustomScan") {
      val ctx = appContext.reactContext ?: return@Function null
      receiverController.stopAllCustomScans(ctx)
    }

    Function("stopCustomScanForAction") { action: String ->
      val ctx = appContext.reactContext ?: return@Function null
      receiverController.stopCustomScanForAction(ctx, action)
    }

    AsyncFunction("getDataWedgeVersion") { promise: Promise ->
      val ctx = appContext.reactContext
      if (ctx == null) {
        promise.resolve(intArrayOf(0, 0, 0))
        return@AsyncFunction
      }

      requestDataWedgeVersion(ctx, promise)
    }

    OnDestroy {
      val ctx = appContext.reactContext ?: return@OnDestroy
      receiverController.cleanup(ctx)
    }
  }
}
