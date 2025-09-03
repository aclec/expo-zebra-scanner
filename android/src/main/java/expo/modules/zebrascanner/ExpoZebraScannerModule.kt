package expo.modules.zebrascanner

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Bundle
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.core.os.bundleOf

import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import android.util.Log

const val ACTION_BARCODE_SCANNED = "com.symbol.datawedge.ACTION_BARCODE_SCANNED"
const val scanEvent = "onBarcodeScanned"
const val customScanEvent = "onCustomScan"

class ExpoZebraScannerModule : Module() {

  private var barcodeReceiver: BroadcastReceiver? = null
  private var customReceiver: BroadcastReceiver? = null

  override fun definition() = ModuleDefinition {

    Name("ExpoZebraScanner")
    Events(scanEvent, customScanEvent)

    Function("startScan") {
      val activity = appContext.activityProvider?.currentActivity
      // appContext.reactContext.sendBroadcast();
      if(activity != null) {

        val filter = IntentFilter()
        filter.addCategory(Intent.CATEGORY_DEFAULT)
        filter.addAction(ACTION_BARCODE_SCANNED)

        barcodeReceiver = BarcodeReceiver(scanEvent, ::sendEvent)
        ContextCompat.registerReceiver(
            activity, barcodeReceiver, filter, ContextCompat.RECEIVER_EXPORTED
        )
      }
    }

    Function("stopScan") {
      val activity = appContext.activityProvider?.currentActivity
      if (activity != null && barcodeReceiver != null) {
        activity.unregisterReceiver(barcodeReceiver)
        barcodeReceiver = null
      }
    }

    // Ported from https://github.com/darryncampbell/react-native-datawedge-intents
    // Credits to @darryncampbell
    Function("sendBroadcast") { obj: Map<String, Any?> ->
      val action: String? = obj["action"] as? String
      val intent = Intent()

      if (action != null) {
        intent.action = action
      }

      val extrasMap: Map<String, Any?>? = obj["extras"] as? Map<String, Any?>
      extrasMap?.forEach { (key, value) ->
        val valueStr = value.toString()

        when (value) {
          is Boolean -> intent.putExtra(key, value.toString())
          is Int -> intent.putExtra(key, value.toString())
          is Long -> intent.putExtra(key, value)
          is Double -> intent.putExtra(key, value)
          else -> {
            if (valueStr.startsWith("{")) {
              val bundle = jsonToBundle(JSONObject(valueStr))
              intent.putExtra(key, bundle)
            } else {
              intent.putExtra(key, valueStr)
            }
          }
        }
      }

      appContext?.reactContext?.sendBroadcast(intent)
    }

    Function("startCustomScan") { action: String ->
      val activity = appContext.activityProvider?.currentActivity
      if (activity != null) {
        // If previously registered, unregister first to avoid duplicates
        if (customReceiver != null) {
          activity.unregisterReceiver(customReceiver)
          customReceiver = null
        }

        val filter = IntentFilter()
        filter.addCategory(Intent.CATEGORY_DEFAULT)
        filter.addAction(action)

        customReceiver = CustomEventReceiver(customScanEvent, ::sendEvent)
        ContextCompat.registerReceiver(
          activity, customReceiver, filter, ContextCompat.RECEIVER_EXPORTED
        )
      }
    }

    Function("stopCustomScan") {
      val activity = appContext.activityProvider?.currentActivity
      if (activity != null && customReceiver != null) {
        activity.unregisterReceiver(customReceiver)
        customReceiver = null
      }
    }

  }

}
