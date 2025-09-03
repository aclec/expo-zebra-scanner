package expo.modules.zebrascanner

import android.content.Intent
import android.os.Bundle
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject


// Ported helper to convert JSONObject into Bundle (used by sendBroadcast)
internal fun jsonToBundle(obj: JSONObject?): Bundle? {
  if (obj == null) return null
  val returnBundle = Bundle()
  try {
    val keys = obj.keys()
    while (keys.hasNext()) {
      val key = keys.next()
      when (val value = obj.get(key)) {
        is String -> returnBundle.putString(key, value)
        is Boolean -> returnBundle.putString(key, value.toString())
        is Int -> returnBundle.putString(key, value.toString())
        is Long -> returnBundle.putLong(key, value)
        is Double -> returnBundle.putDouble(key, value)
        is JSONArray -> {
          if (value.length() > 0) {
            when (value.get(0)) {
              is String -> {
                val stringArray = Array(value.length()) { i -> value.getString(i) }
                returnBundle.putStringArray(key, stringArray)
              }
              is Int -> {
                val intArray = IntArray(value.length()) { i -> value.getInt(i) }
                returnBundle.putIntArray(key, intArray)
              }
              is JSONObject -> {
                val bundleArray = Array(value.length()) { i -> jsonToBundle(value.getJSONObject(i)) }
                returnBundle.putParcelableArray(key, bundleArray)
              }
              else -> throw IllegalArgumentException("Unsupported JSONArray type for key: $key")
            }
          }
        }
        is JSONObject -> returnBundle.putBundle(key, jsonToBundle(value))
        else -> throw IllegalArgumentException("Unsupported type for key: $key")
      }
    }
  } catch (e: JSONException) {
    e.printStackTrace()
  }
  return returnBundle
}

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
  if (v == null) return intArrayOf(0,0,0)
  val parts = v.trim().split('.', '-', ' ').filter { it.isNotEmpty() }
  val nums = IntArray(3)
  for (i in 0..2) {
    nums[i] = parts.getOrNull(i)?.toIntOrNull() ?: 0
  }
  return nums
}
