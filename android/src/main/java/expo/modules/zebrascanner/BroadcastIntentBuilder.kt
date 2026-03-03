package expo.modules.zebrascanner

import android.content.Intent
import android.os.Bundle
import android.os.Parcelable

internal fun buildBroadcastIntent(payload: Map<String, Any?>): Intent {
  val intent = Intent()
  (payload["action"] as? String)?.let { intent.action = it }

  val extrasMap = payload["extras"] as? Map<*, *>
  extrasMap?.forEach { (rawKey, value) ->
    val key = rawKey as? String ?: return@forEach
    when (value) {
      is Boolean -> intent.putExtra(key, value.toString())
      is Int -> intent.putExtra(key, value.toString())
      is Long -> intent.putExtra(key, value)
      is Double -> intent.putExtra(key, value)
      is Map<*, *> -> intent.putExtra(key, mapToBundle(value))
      is List<*> -> putListAsIntentExtra(intent, key, value)
      else -> intent.putExtra(key, value?.toString())
    }
  }

  return intent
}

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
      is List<*> -> putListAsBundleExtra(bundle, key, value)
      else -> bundle.putString(key, value.toString())
    }
  }
  return bundle
}

private fun putListAsIntentExtra(intent: Intent, key: String, list: List<*>) {
  if (list.isEmpty()) return
  when (list.firstOrNull { it != null }) {
    is String -> intent.putExtra(key, list.map { it?.toString() ?: "" }.toTypedArray())
    is Map<*, *> -> {
      val bundles = list.filterIsInstance<Map<*, *>>().map { mapToBundle(it) }.toTypedArray<Parcelable>()
      intent.putExtra(key, bundles)
    }
    else -> intent.putExtra(key, list.toString())
  }
}

private fun putListAsBundleExtra(bundle: Bundle, key: String, list: List<*>) {
  if (list.isEmpty()) return
  when (list.firstOrNull { it != null }) {
    is String -> bundle.putStringArray(key, list.map { it?.toString() ?: "" }.toTypedArray())
    is Map<*, *> -> {
      val bundles = list.filterIsInstance<Map<*, *>>().map { mapToBundle(it) }.toTypedArray<Parcelable>()
      bundle.putParcelableArray(key, bundles)
    }
    else -> bundle.putString(key, list.toString())
  }
}
