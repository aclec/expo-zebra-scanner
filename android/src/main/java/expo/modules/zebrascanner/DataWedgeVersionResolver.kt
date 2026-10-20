package expo.modules.zebrascanner

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Handler
import android.os.Looper
import androidx.core.content.ContextCompat
import expo.modules.kotlin.Promise
import java.util.UUID
import java.util.concurrent.atomic.AtomicBoolean

private const val RESULT_ACTION = "com.symbol.datawedge.api.RESULT_ACTION"
private const val EXTRA_VERSION_INFO = "com.symbol.datawedge.api.RESULT_GET_VERSION_INFO"
private const val EXTRA_RESULT_INFO = "com.symbol.datawedge.api.RESULT_INFO"
private const val EXTRA_COMMAND_IDENTIFIER = "COMMAND_IDENTIFIER"
private const val TIMEOUT_MS = 3000L

internal fun requestDataWedgeVersion(context: Context, promise: Promise) {
  DataWedgeVersionRequest(context, promise).start()
}

/**
 * One-shot GET_VERSION_INFO round trip. Completion can race between the main thread (reply,
 * timeout) and the calling thread (registration/broadcast failure), so it is guarded atomically:
 * the promise resolves exactly once and the receiver is always unregistered.
 */
private class DataWedgeVersionRequest(
  private val context: Context,
  private val promise: Promise
) : BroadcastReceiver() {
  private val completed = AtomicBoolean(false)
  private val registered = AtomicBoolean(false)
  private val handler = Handler(Looper.getMainLooper())
  private val timeout = Runnable { complete(fallbackVersion()) }
  // Echoed back by DataWedge, so a RESULT_INFO reply to another component's command
  // (same default RESULT_ACTION) is not mistaken for the failure of this query.
  private val commandId = "expo-zebra-scanner-version-${UUID.randomUUID()}"

  fun start() {
    val filter = IntentFilter(RESULT_ACTION).apply { addCategory(Intent.CATEGORY_DEFAULT) }
    try {
      ContextCompat.registerReceiver(context, this, filter, ContextCompat.RECEIVER_EXPORTED)
      registered.set(true)
    } catch (_: Throwable) {
      complete(fallbackVersion())
      return
    }
    // A version reply to another component's query may have completed us on the main thread
    // before `registered` was set; complete() could not unregister then, so do it here.
    if (completed.get()) {
      unregister()
      return
    }

    handler.postDelayed(timeout, TIMEOUT_MS)

    val intent = Intent(DATAWEDGE_API_ACTION).apply {
      putExtra("com.symbol.datawedge.api.GET_VERSION_INFO", "true")
      putExtra("com.symbol.datawedge.api.SEND_RESULT", "true")
      putExtra("com.symbol.datawedge.api.RESULT_ACTION", RESULT_ACTION)
      putExtra("com.symbol.datawedge.api.RESULT_CATEGORY", Intent.CATEGORY_DEFAULT)
      putExtra("com.symbol.datawedge.api.RESULT_PACKAGE", context.packageName)
      putExtra(EXTRA_COMMAND_IDENTIFIER, commandId)
    }
    try {
      context.sendBroadcast(intent)
    } catch (_: Throwable) {
      complete(fallbackVersion())
    }
  }

  override fun onReceive(ctx: Context, intent: Intent) {
    if (intent.action != RESULT_ACTION) return
    try {
      when {
        intent.hasExtra(EXTRA_VERSION_INFO) ->
          complete(parseVersion(intent.getBundleExtra(EXTRA_VERSION_INFO)?.getString("DATAWEDGE")))
        intent.hasExtra(EXTRA_RESULT_INFO) && intent.getStringExtra(EXTRA_COMMAND_IDENTIFIER) == commandId ->
          complete(fallbackVersion())
      }
    } catch (_: Throwable) {
      // Malformed extras (e.g. BadParcelableException) must not leave the promise pending.
      complete(fallbackVersion())
    }
  }

  private fun complete(version: IntArray) {
    if (!completed.compareAndSet(false, true)) return
    handler.removeCallbacks(timeout)
    unregister()
    promise.resolve(version)
  }

  private fun unregister() {
    if (!registered.getAndSet(false)) return
    try {
      context.unregisterReceiver(this)
    } catch (_: Throwable) {
      // Already unregistered.
    }
  }
}
