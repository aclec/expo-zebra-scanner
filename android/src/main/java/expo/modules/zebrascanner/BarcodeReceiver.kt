package expo.modules.zebrascanner

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Bundle
import androidx.core.os.bundleOf

/**
 * BroadcastReceiver that forwards DataWedge scan intents to JS with a configurable event name.
 */
internal class BarcodeReceiver(
  private val eventName: String,
  private val emitter: (name: String, body: Bundle?) -> Unit
) : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val scanData = intent.getStringExtra("com.symbol.datawedge.data_string") ?: ""
    val scanLabelType = intent.getStringExtra("com.symbol.datawedge.label_type") ?: ""

    val eventData = bundleOf(
      "scanData" to scanData,
      "scanLabelType" to scanLabelType
    )
    emitter(eventName, eventData)
  }
}
