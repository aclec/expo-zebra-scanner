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

class BarcodeReceiver(val ev: (name: String, body: Bundle?) -> Unit) : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {

    if (intent.action.equals(ACTION_BARCODE_SCANNED)) {
      val scanData = intent.getStringExtra("com.symbol.datawedge.data_string")
      val scanLabelType = intent.getStringExtra("com.symbol.datawedge.label_type")

      // Handle barcode data
      val eventData = bundleOf(
        "scanData" to scanData,
        "scanLabelType" to scanLabelType
      )
      this.ev(scanEvent, eventData)
    }

  }

}

class ExpoZebraScannerModule : Module() {

  private var barcodeReceiver: BroadcastReceiver? = null

  override fun definition() = ModuleDefinition {

    Name("ExpoZebraScanner")
    Events(scanEvent)

    Function("startScan") {
      val activity = appContext.activityProvider?.currentActivity
      // appContext.reactContext.sendBroadcast();
      if(activity != null) {

        val filter = IntentFilter()
        filter.addCategory(Intent.CATEGORY_DEFAULT)
        filter.addAction(ACTION_BARCODE_SCANNED)

        barcodeReceiver = BarcodeReceiver(::sendEvent)
        activity.registerReceiver(
          barcodeReceiver, filter, ContextCompat.RECEIVER_EXPORTED
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
              val bundle = toBundle(JSONObject(valueStr))
              intent.putExtra(key, bundle)
            } else {
              intent.putExtra(key, valueStr)
            }
          }
        }
      }

      appContext?.reactContext?.sendBroadcast(intent)
    }

  }

  // Ported from https://github.com/darryncampbell/react-native-datawedge-intents
  // Credits to @darryncampbell
  private fun toBundle(obj: JSONObject?): Bundle? {
    if (obj == null) {
      return null
    }
    val returnBundle = Bundle()
    try {
      val keys = obj.keys()
      while (keys.hasNext()) {
        val key = keys.next()
        when (val value = obj.get(key)) {
          is String -> returnBundle.putString(key, value)
          is Boolean -> returnBundle.putString(key, value.toString())
          is Int -> returnBundle.putString(key, value.toString())
          is Long -> returnBundle.putLong(key, value)
          is Double -> returnBundle.putDouble(key, value)
          is JSONArray -> {
            if (value.length() > 0) {
              when (value.get(0)) {
                is String -> {
                  val stringArray = Array(value.length()) { i -> value.getString(i) }
                  returnBundle.putStringArray(key, stringArray)
                }
                is Int -> {
                  val intArray = IntArray(value.length()) { i -> value.getInt(i) }
                  returnBundle.putIntArray(key, intArray)
                }
                is JSONObject -> {
                  val bundleArray = Array(value.length()) { i -> toBundle(value.getJSONObject(i)) }
                  returnBundle.putParcelableArray(key, bundleArray)
                }
                else -> throw IllegalArgumentException("Unsupported JSONArray type for key: $key")
              }
            }
          }
          is JSONObject -> returnBundle.putBundle(key, toBundle(value))
          else -> throw IllegalArgumentException("Unsupported type for key: $key")
        }
      }
    } catch (e: JSONException) {
       e.printStackTrace()
    }
    return returnBundle
  }

}
