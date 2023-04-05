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

  private lateinit var barcodeReceiver: BroadcastReceiver

  override fun definition() = ModuleDefinition {

    Name("ExpoZebraScanner")
    Events(scanEvent)

    Function("startScan") {
      val activity = appContext.activityProvider?.currentActivity
      if(activity != null) {

        val filter = IntentFilter()
        filter.addCategory(Intent.CATEGORY_DEFAULT)
        filter.addAction(ACTION_BARCODE_SCANNED)

        barcodeReceiver = BarcodeReceiver(::sendEvent)
        activity.registerReceiver(
          barcodeReceiver, filter
        )

      }
    }

    Function("stopScan") {
      val activity = appContext.activityProvider?.currentActivity
      if(activity != null) {
        activity.unregisterReceiver(barcodeReceiver)
      }
    }

  }

}
