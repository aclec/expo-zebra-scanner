package expo.modules.zebrascanner

import android.content.Intent
import android.os.Bundle
import android.os.Parcelable
import java.util.ArrayList

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

// Normalize intent extras into a JS-safe Bundle. Top-level Boolean/Int values become strings for a
// stable payload contract (DataWedge sends most values as strings); nested bundles keep their
// scalar types but get the same array handling, so no value ever reaches JS as toString() output
// or as a Parcelable Expo cannot convert. Bundle.get(key) is deprecated since API 33 but has no
// typed generic replacement for iterating unknown extras.
@Suppress("DEPRECATION")
private fun extrasToBundle(extras: Bundle?, topLevel: Boolean = true): Bundle {
  val out = Bundle()
  if (extras == null) return out
  for (key in extras.keySet()) {
    when (val value = extras.get(key)) {
      null -> out.putString(key, null)
      is String -> out.putString(key, value)
      is Boolean -> if (topLevel) out.putString(key, value.toString()) else out.putBoolean(key, value)
      is Int -> if (topLevel) out.putString(key, value.toString()) else out.putInt(key, value)
      is Long -> out.putLong(key, value)
      is Double -> out.putDouble(key, value)
      is Float -> out.putDouble(key, value.toDouble())
      is Bundle -> out.putBundle(key, extrasToBundle(value, topLevel = false))
      is IntArray -> out.putIntArray(key, value)
      is LongArray -> out.putLongArray(key, value)
      is FloatArray -> out.putFloatArray(key, value)
      is DoubleArray -> out.putDoubleArray(key, value)
      is BooleanArray -> out.putBooleanArray(key, value)
      is ByteArray -> out.putIntArray(key, value.toUnsignedInts())
      is Array<*> -> putArray(out, key, value.asList())
      is List<*> -> putArray(out, key, value)
      else -> out.putString(key, value.toString())
    }
  }
  return out
}

// Collections become JS arrays instead of their unreadable toString() ("[Ljava.lang.String;@1a2b3c"):
// strings and bundles (e.g. DataWedge's RESULT_LIST), numbers, and byte arrays such as
// DataWedge's `decode_data` (ArrayList<byte[]>), which arrive as arrays of unsigned byte values.
private fun putArray(out: Bundle, key: String, values: List<*>) {
  when {
    values.all { it == null || it is String } -> out.putStringArray(key, values.map { it as String? }.toTypedArray())
    values.all { it == null || it is Bundle } ->
      out.putParcelableArray(key, values.map { (it as Bundle?)?.let { b -> extrasToBundle(b, topLevel = false) } }.toTypedArray<Parcelable?>())
    values.all { it == null || it is ByteArray } -> out.putSerializable(key, ArrayList(values.map { (it as ByteArray?)?.toUnsignedInts() }))
    values.all { it is Byte } -> out.putIntArray(key, values.map { (it as Byte).toInt() and 0xFF }.toIntArray())
    values.all { it is Int || it is Short } -> out.putIntArray(key, values.map { (it as Number).toInt() }.toIntArray())
    values.all { it is Number } -> out.putDoubleArray(key, values.map { (it as Number).toDouble() }.toDoubleArray())
    else -> out.putString(key, values.toString())
  }
}

// Raw barcode bytes are unsigned (0-255); Kotlin bytes are signed.
private fun ByteArray.toUnsignedInts(): IntArray = IntArray(size) { this[it].toInt() and 0xFF }

internal fun fallbackVersion(): IntArray = intArrayOf(0, 0, 0)

internal fun parseVersion(v: String?): IntArray {
  if (v == null) return fallbackVersion()
  val parts = v.trim().split('.', '-', ' ').filter { it.isNotEmpty() }
  val nums = IntArray(3)
  for (i in 0..2) {
    nums[i] = parts.getOrNull(i)?.toIntOrNull() ?: 0
  }
  return nums
}
