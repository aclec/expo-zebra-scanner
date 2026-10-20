package expo.modules.zebrascanner

import android.content.Intent
import android.os.Bundle
import android.os.Parcelable

internal fun buildBroadcastIntent(payload: Map<String, Any?>): Intent {
  val intent = Intent()
  (payload["action"] as? String)?.let { intent.action = it }
  (payload["extras"] as? Map<*, *>)?.let { intent.putExtras(mapToBundle(it)) }
  return intent
}

// Booleans and ints are sent as strings: DataWedge reads most API values with getStringExtra.
private fun mapToBundle(map: Map<*, *>): Bundle {
  val bundle = Bundle()
  for ((rawKey, value) in map) {
    val key = rawKey as? String ?: continue
    when (value) {
      null -> {}
      is String -> bundle.putString(key, value)
      is Boolean -> bundle.putString(key, value.toString())
      is Int -> bundle.putString(key, value.toString())
      is Long -> bundle.putLong(key, value)
      is Double -> bundle.putDouble(key, value)
      is Float -> bundle.putDouble(key, value.toDouble())
      is Map<*, *> -> bundle.putBundle(key, mapToBundle(value))
      is List<*> -> putList(bundle, key, value)
      else -> bundle.putString(key, value.toString())
    }
  }
  return bundle
}

private fun putList(bundle: Bundle, key: String, list: List<*>) {
  val first = list.firstOrNull { it != null }
  when {
    first == null -> {}
    first is String -> bundle.putStringArray(key, list.map { it?.toString() ?: "" }.toTypedArray())
    first is Map<*, *> -> {
      val bundles = list.filterIsInstance<Map<*, *>>().map { mapToBundle(it) }.toTypedArray<Parcelable>()
      bundle.putParcelableArray(key, bundles)
    }
    // JS numbers arrive as Double; DataWedge expects int[] (e.g. NOTIFY's NOTIFICATION).
    // Only all-number lists are converted, so element positions are never shifted.
    list.all { it is Number } -> {
      val numbers = list.map { (it as Number).toDouble() }
      if (numbers.all { it % 1.0 == 0.0 && it >= Int.MIN_VALUE && it <= Int.MAX_VALUE }) {
        bundle.putIntArray(key, numbers.map { it.toInt() }.toIntArray())
      } else {
        bundle.putDoubleArray(key, numbers.toDoubleArray())
      }
    }
    else -> bundle.putString(key, list.toString())
  }
}
