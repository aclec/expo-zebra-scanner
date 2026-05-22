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

  b.putBundle("extras", extrasToBundle(intent.extras))
  return b
}

// Normalize intent extras into a JS-safe Bundle, keeping scalar values as
// strings for a stable payload contract. Bundle.get(key) is deprecated since
// API 33 but has no typed generic replacement for iterating unknown extras.
@Suppress("DEPRECATION")
private fun extrasToBundle(extras: Bundle?): Bundle {
  val out = Bundle()
  if (extras == null) return out
  for (key in extras.keySet()) {
    when (val value = extras.get(key)) {
      null -> out.putString(key, null)
      is String -> out.putString(key, value)
      is Boolean -> out.putString(key, value.toString())
      is Int -> out.putString(key, value.toString())
      is Long -> out.putLong(key, value)
      is Double -> out.putDouble(key, value)
      is Float -> out.putDouble(key, value.toDouble())
      is Bundle -> out.putBundle(key, value)
      else -> out.putString(key, value.toString())
    }
  }
  return out
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
