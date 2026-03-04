package expo.modules.zebrascanner

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Bundle
import androidx.core.content.ContextCompat

internal class ReceiverController(
  private val emitter: (name: String, body: Bundle?) -> Unit
) {
  private var barcodeReceiver: BroadcastReceiver? = null
  private val customReceivers = mutableMapOf<String, BroadcastReceiver>()

  private fun normalizeAction(action: String): String? {
    val normalized = action.trim()
    return normalized.takeIf { it.isNotEmpty() }
  }

  private fun safeUnregister(context: Context, receiver: BroadcastReceiver?) {
    if (receiver == null) return
    try {
      context.unregisterReceiver(receiver)
    } catch (_: Throwable) {
      // Receiver may already be unregistered during fast refresh / activity transitions.
    }
  }

  fun startBarcodeScan(context: Context) {
    if (barcodeReceiver != null) return

    val filter = IntentFilter().apply {
      addCategory(Intent.CATEGORY_DEFAULT)
      addAction(ACTION_BARCODE_SCANNED)
    }

    val receiver = BarcodeReceiver(EVENT_BARCODE_SCANNED, emitter)
    try {
      ContextCompat.registerReceiver(
        context,
        receiver,
        filter,
        ContextCompat.RECEIVER_EXPORTED
      )
      barcodeReceiver = receiver
    } catch (_: Throwable) {
      // Keep internal state unchanged if registration fails.
    }
  }

  fun stopBarcodeScan(context: Context) {
    safeUnregister(context, barcodeReceiver)
    barcodeReceiver = null
  }

  fun startCustomScan(context: Context, action: String) {
    val normalizedAction = normalizeAction(action) ?: return
    if (customReceivers.containsKey(normalizedAction)) return

    val filter = IntentFilter().apply {
      addCategory(Intent.CATEGORY_DEFAULT)
      addAction(normalizedAction)
    }

    val customReceiver = CustomEventReceiver(EVENT_CUSTOM_SCAN, emitter)
    try {
      ContextCompat.registerReceiver(
        context,
        customReceiver,
        filter,
        ContextCompat.RECEIVER_EXPORTED
      )
      customReceivers[normalizedAction] = customReceiver
    } catch (_: Throwable) {
      // Keep internal state unchanged if registration fails.
    }
  }

  fun stopAllCustomScans(context: Context) {
    customReceivers.values.forEach { receiver -> safeUnregister(context, receiver) }
    customReceivers.clear()
  }

  fun stopCustomScanForAction(context: Context, action: String) {
    val normalizedAction = normalizeAction(action) ?: return
    val receiver = customReceivers.remove(normalizedAction) ?: return
    safeUnregister(context, receiver)
  }

  fun cleanup(context: Context) {
    stopBarcodeScan(context)
    stopAllCustomScans(context)
  }
}
