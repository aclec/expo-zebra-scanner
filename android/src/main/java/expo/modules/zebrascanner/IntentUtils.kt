package expo.modules.zebrascanner

import android.content.Intent
import android.os.Bundle

// Convert an Intent into a Bundle safe to emit to JS listeners
internal fun intentToBundle(intent: Intent): Bundle {
  val b = Bundle()
  b.putString("action", intent.action)

  // Categories
  val cats = intent.categories
  if (cats != null && cats.isNotEmpty()) {
    b.putStringArray("categories", cats.toTypedArray())
  }

  // Data URI and Mime type
  intent.dataString?.let { b.putString("data", it) }
  intent.type?.let { b.putString("type", it) }

  // All extras (stringify unknowns to be safe)
  val extrasBundle = Bundle()
  val extras = intent.extras
  if (extras != null) {
    for (key in extras.keySet()) {
      val value = extras.get(key)
      when (value) {
        null -> extrasBundle.putString(key, null)
        is String -> extrasBundle.putString(key, value)
        is Boolean -> extrasBundle.putString(key, value.toString())
        is Int -> extrasBundle.putString(key, value.toString())
        is Long -> extrasBundle.putLong(key, value)
        is Double -> extrasBundle.putDouble(key, value)
        is Float -> extrasBundle.putDouble(key, value.toDouble())
        is Bundle -> extrasBundle.putBundle(key, value)
        else -> extrasBundle.putString(key, value.toString())
      }
    }
  }
  b.putBundle("extras", extrasBundle)
  return b
}

internal fun parseVersion(v: String?): IntArray {
  if (v == null) return intArrayOf(0, 0, 0)
  val parts = v.trim().split('.', '-', ' ').filter { it.isNotEmpty() }
  val nums = IntArray(3)
  for (i in 0..2) {
    nums[i] = parts.getOrNull(i)?.toIntOrNull() ?: 0
  }
  return nums
}
