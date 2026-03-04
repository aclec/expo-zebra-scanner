package expo.modules.zebrascanner

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Handler
import android.os.Looper
import androidx.core.content.ContextCompat
import expo.modules.kotlin.Promise

internal fun requestDataWedgeVersion(context: Context, promise: Promise) {
  val resultAction = "com.symbol.datawedge.api.RESULT_ACTION"
  val resultCategory = Intent.CATEGORY_DEFAULT
  val timeoutMs = 3000L

  var completed = false
  var receiverRegistered = false
  val handler = Handler(Looper.getMainLooper())
  var timeoutRunnable: Runnable? = null
  var receiver: BroadcastReceiver? = null
  val fallback = intArrayOf(0, 0, 0)

  fun complete(result: IntArray) {
    if (completed) return
    completed = true
    timeoutRunnable?.let { handler.removeCallbacks(it) }
    if (receiverRegistered) {
      try {
        receiver?.let { context.unregisterReceiver(it) }
      } catch (_: Throwable) {
      } finally {
        receiverRegistered = false
      }
    }
    promise.resolve(result)
  }

  receiver = object : BroadcastReceiver() {
    override fun onReceive(ctx: Context, intent: Intent) {
      if (completed) return
      try {
        if (intent.action == resultAction && intent.hasExtra("com.symbol.datawedge.api.RESULT_GET_VERSION_INFO")) {
          val bundle = intent.getBundleExtra("com.symbol.datawedge.api.RESULT_GET_VERSION_INFO")
          val dw = bundle?.getString("DATAWEDGE") ?: "0.0.0"
          complete(parseVersion(dw))
        } else if (intent.action == resultAction && intent.hasExtra("com.symbol.datawedge.api.RESULT_INFO")) {
          complete(fallback)
        }
      } catch (_: Throwable) {
        complete(fallback)
      }
    }
  }

  val filter = IntentFilter().apply {
    addAction(resultAction)
    addCategory(resultCategory)
  }
  val localReceiver = receiver ?: run {
    complete(fallback)
    return
  }
  try {
    ContextCompat.registerReceiver(context, localReceiver, filter, ContextCompat.RECEIVER_EXPORTED)
    receiverRegistered = true
  } catch (_: Throwable) {
    complete(fallback)
    return
  }

  timeoutRunnable = Runnable {
    complete(fallback)
  }
  handler.postDelayed(timeoutRunnable, timeoutMs)

  val intent = Intent().apply {
    action = DATAWEDGE_API_ACTION
    putExtra("com.symbol.datawedge.api.GET_VERSION_INFO", "true")
    putExtra("com.symbol.datawedge.api.SEND_RESULT", "true")
    putExtra("com.symbol.datawedge.api.RESULT_ACTION", resultAction)
    putExtra("com.symbol.datawedge.api.RESULT_CATEGORY", resultCategory)
    putExtra("com.symbol.datawedge.api.RESULT_PACKAGE", context.packageName)
  }
  try {
    context.sendBroadcast(intent)
  } catch (_: Throwable) {
    complete(fallback)
  }
}
