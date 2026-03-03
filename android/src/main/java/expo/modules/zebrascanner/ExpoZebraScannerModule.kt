package expo.modules.zebrascanner

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import androidx.core.content.ContextCompat
import expo.modules.kotlin.Promise
import org.json.JSONObject

const val ACTION_BARCODE_SCANNED = "com.symbol.datawedge.ACTION_BARCODE_SCANNED"
const val scanEvent = "onBarcodeScanned"
const val customScanEvent = "onCustomScan"

class ExpoZebraScannerModule : Module() {

  private var barcodeReceiver: BroadcastReceiver? = null
  private var customReceiver: BroadcastReceiver? = null
  private var customAction: String? = null

  private fun safeUnregister(context: Context, receiver: BroadcastReceiver?) {
    if (receiver == null) return
    try {
      context.unregisterReceiver(receiver)
    } catch (_: Throwable) {
      // No-op: receiver may already be gone during fast-refresh/activity transitions
    }
  }

  override fun definition() = ModuleDefinition {

    Name("ExpoZebraScanner")
    Events(scanEvent, customScanEvent)

    Function("startScan") {
      val ctx = appContext.reactContext ?: return@Function null
      if (barcodeReceiver != null) return@Function null

      val filter = IntentFilter().apply {
        addCategory(Intent.CATEGORY_DEFAULT)
        addAction(ACTION_BARCODE_SCANNED)
      }

      barcodeReceiver = BarcodeReceiver(scanEvent, ::sendEvent)
      ContextCompat.registerReceiver(
        ctx, barcodeReceiver, filter, ContextCompat.RECEIVER_EXPORTED
      )
    }

    Function("stopScan") {
      val ctx = appContext.reactContext ?: return@Function null
      safeUnregister(ctx, barcodeReceiver)
      barcodeReceiver = null
    }

    // Ported from https://github.com/darryncampbell/react-native-datawedge-intents
    // Credits to @darryncampbell
    Function("sendBroadcast") { obj: Map<String, Any?> ->
      val action: String? = obj["action"] as? String
      val intent = Intent()

      if (action != null) {
        intent.action = action
      }

      val extrasMap = obj["extras"] as? Map<*, *>
      extrasMap?.forEach { (rawKey, value) ->
        val key = rawKey as? String ?: return@forEach
        val valueStr = value.toString()

        when (value) {
          is Boolean -> intent.putExtra(key, value.toString())
          is Int -> intent.putExtra(key, value.toString())
          is Long -> intent.putExtra(key, value)
          is Double -> intent.putExtra(key, value)
          else -> {
            if (valueStr.startsWith("{")) {
              val bundle = try {
                jsonToBundle(JSONObject(valueStr))
              } catch (_: Throwable) {
                null
              }
              if (bundle != null) {
                intent.putExtra(key, bundle)
              } else {
                intent.putExtra(key, valueStr)
              }
            } else {
              intent.putExtra(key, valueStr)
            }
          }
        }
      }

      appContext?.reactContext?.sendBroadcast(intent)
    }

    Function("startCustomScan") { action: String ->
      val ctx = appContext.reactContext ?: return@Function null
      if (customReceiver != null && customAction == action) return@Function null

      // Re-register on action changes to avoid duplicate receivers
      safeUnregister(ctx, customReceiver)
      customReceiver = null

      val filter = IntentFilter().apply {
        addCategory(Intent.CATEGORY_DEFAULT)
        addAction(action)
      }

      customReceiver = CustomEventReceiver(customScanEvent, ::sendEvent)
      customAction = action
      ContextCompat.registerReceiver(
        ctx, customReceiver, filter, ContextCompat.RECEIVER_EXPORTED
      )
    }

    Function("stopCustomScan") {
      val ctx = appContext.reactContext ?: return@Function null
      safeUnregister(ctx, customReceiver)
      customReceiver = null
      customAction = null
    }

    AsyncFunction("getDataWedgeVersion") { promise: Promise ->
      val ctx = appContext.reactContext
      if (ctx == null) {
        promise.resolve(intArrayOf(0, 0, 0))
        return@AsyncFunction
      }

      val resultAction = "com.symbol.datawedge.api.RESULT_ACTION" // can be custom if you want
      val resultCategory = Intent.CATEGORY_DEFAULT
      val timeoutMs = 3000L

      var completed = false
      val handler = android.os.Handler(android.os.Looper.getMainLooper())
      var timeoutRunnable: Runnable? = null

      // One-shot receiver to capture version info
      val receiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
          if (completed) return
          try {
            if (intent.action == resultAction && intent.hasExtra("com.symbol.datawedge.api.RESULT_GET_VERSION_INFO")) {
              val bundle = intent.getBundleExtra("com.symbol.datawedge.api.RESULT_GET_VERSION_INFO")
              val dw = bundle?.getString("DATAWEDGE") ?: "0.0.0"
              completed = true
              timeoutRunnable?.let { handler.removeCallbacks(it) }
              promise.resolve(parseVersion(dw))
            } else if (intent.action == resultAction && intent.hasExtra("com.symbol.datawedge.api.RESULT_INFO")) {
              completed = true
              timeoutRunnable?.let { handler.removeCallbacks(it) }
              promise.resolve(intArrayOf(0, 0, 0))
            }
          } catch (_: Throwable) {
            if (!completed) {
              completed = true
              timeoutRunnable?.let { handler.removeCallbacks(it) }
              promise.resolve(intArrayOf(0, 0, 0))
            }
          } finally {
            try { ctx.unregisterReceiver(this) } catch (_: Throwable) {}
          }
        }
      }

      // Register receiver
      val filter = IntentFilter().apply {
        addAction(resultAction)
        addCategory(resultCategory)
      }
      ContextCompat.registerReceiver(ctx, receiver, filter, ContextCompat.RECEIVER_EXPORTED)

      // Timeout fallback
      timeoutRunnable = Runnable {
        if (!completed) {
          completed = true
          try { ctx.unregisterReceiver(receiver) } catch (_: Throwable) {}
          promise.resolve(intArrayOf(0, 0, 0))
        }
      }
      handler.postDelayed(timeoutRunnable!!, timeoutMs)

      // Send request
      val intent = Intent().apply {
        action = "com.symbol.datawedge.api.ACTION"
        putExtra("com.symbol.datawedge.api.GET_VERSION_INFO", "true")
        putExtra("com.symbol.datawedge.api.SEND_RESULT", "true")
        putExtra("com.symbol.datawedge.api.RESULT_ACTION", resultAction)
        putExtra("com.symbol.datawedge.api.RESULT_CATEGORY", resultCategory)
        putExtra("com.symbol.datawedge.api.RESULT_PACKAGE", ctx.packageName)
      }
      ctx.sendBroadcast(intent)
    }

    OnDestroy {
      val ctx = appContext.reactContext ?: return@OnDestroy
      safeUnregister(ctx, barcodeReceiver)
      safeUnregister(ctx, customReceiver)
      barcodeReceiver = null
      customReceiver = null
      customAction = null
    }

  }

}
