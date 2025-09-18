package expo.modules.zebrascanner

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Generic BroadcastReceiver that forwards the entire received Intent to JS.
 */
class CustomEventReceiver(
  private val eventName: String,
  private val emitter: (name: String, body: android.os.Bundle?) -> Unit
) : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val payload = intentToBundle(intent)
    emitter(eventName, payload)
  }
}
