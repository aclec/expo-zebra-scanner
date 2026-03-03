package expo.modules.zebrascanner

import android.content.Intent
import org.json.JSONObject

internal fun buildBroadcastIntent(payload: Map<String, Any?>): Intent {
  val intent = Intent()
  (payload["action"] as? String)?.let { intent.action = it }

  val extrasMap = payload["extras"] as? Map<*, *>
  extrasMap?.forEach { (rawKey, value) ->
    val key = rawKey as? String ?: return@forEach
    val valueStr = value.toString()

    when (value) {
      is Boolean -> intent.putExtra(key, value.toString())
      is Int -> intent.putExtra(key, value.toString())
      is Long -> intent.putExtra(key, value)
      is Double -> intent.putExtra(key, value)
      else -> {
        if (valueStr.startsWith("{")) {
          val bundle = try {
            jsonToBundle(JSONObject(valueStr))
          } catch (_: Throwable) {
            null
          }
          if (bundle != null) {
            intent.putExtra(key, bundle)
          } else {
            intent.putExtra(key, valueStr)
          }
        } else {
          intent.putExtra(key, valueStr)
        }
      }
    }
  }

  return intent
}
