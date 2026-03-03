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
  val handler = Handler(Looper.getMainLooper())
  var timeoutRunnable: Runnable? = null

  val receiver = object : BroadcastReceiver() {
    override fun onReceive(ctx: Context, intent: Intent) {
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
        try {
          context.unregisterReceiver(this)
        } catch (_: Throwable) {
        }
      }
    }
  }

  val filter = IntentFilter().apply {
    addAction(resultAction)
    addCategory(resultCategory)
  }
  ContextCompat.registerReceiver(context, receiver, filter, ContextCompat.RECEIVER_EXPORTED)

  timeoutRunnable = Runnable {
    if (!completed) {
      completed = true
      try {
        context.unregisterReceiver(receiver)
      } catch (_: Throwable) {
      }
      promise.resolve(intArrayOf(0, 0, 0))
    }
  }
  handler.postDelayed(timeoutRunnable, timeoutMs)

  val intent = Intent().apply {
    action = "com.symbol.datawedge.api.ACTION"
    putExtra("com.symbol.datawedge.api.GET_VERSION_INFO", "true")
    putExtra("com.symbol.datawedge.api.SEND_RESULT", "true")
    putExtra("com.symbol.datawedge.api.RESULT_ACTION", resultAction)
    putExtra("com.symbol.datawedge.api.RESULT_CATEGORY", resultCategory)
    putExtra("com.symbol.datawedge.api.RESULT_PACKAGE", context.packageName)
  }
  context.sendBroadcast(intent)
}
