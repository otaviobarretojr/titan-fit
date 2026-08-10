package com.otaviobarretojr.titanfit.health

import androidx.activity.result.ActivityResultLauncher
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.ActiveCaloriesBurnedRecord
import androidx.health.connect.client.records.BodyFatRecord
import androidx.health.connect.client.records.DistanceRecord
import androidx.health.connect.client.records.ExerciseSessionRecord
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import java.time.Instant
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

@CapacitorPlugin(name = "TitanHealthConnect")
class TitanHealthConnectPlugin : Plugin() {
    private var permissionLauncher: ActivityResultLauncher<Set<String>>? = null
    private var pendingPermissionCall: PluginCall? = null
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    private val client: HealthConnectClient?
        get() = if (HealthConnectClient.getSdkStatus(context) == HealthConnectClient.SDK_AVAILABLE) {
            HealthConnectClient.getOrCreate(context)
        } else null

    override fun load() {
        permissionLauncher = activity.registerForActivityResult(
            PermissionController.createRequestPermissionResultContract()
        ) { granted ->
            pendingPermissionCall?.let { call ->
                val requested = permissionsFor(call.getArray("types") ?: JSArray())
                call.resolve(JSObject().put("granted", granted.containsAll(requested)))
            }
            pendingPermissionCall = null
        }
    }

    override fun handleOnDestroy() {
        scope.cancel()
        super.handleOnDestroy()
    }

    @PluginMethod
    fun isAvailable(call: PluginCall) {
        val status = HealthConnectClient.getSdkStatus(context)
        call.resolve(JSObject().put("available", status == HealthConnectClient.SDK_AVAILABLE))
    }

    @PluginMethod
    fun requestHealthPermissions(call: PluginCall) {
        val hc = client ?: run {
            call.resolve(JSObject().put("granted", false))
            return
        }
        val requested = permissionsFor(call.getArray("types") ?: JSArray())
        scope.launch {
            try {
                val granted = hc.permissionController.getGrantedPermissions()
                if (granted.containsAll(requested)) {
                    call.resolve(JSObject().put("granted", true))
                    return@launch
                }
                activity.runOnUiThread {
                    pendingPermissionCall = call
                    permissionLauncher?.launch(requested)
                        ?: call.reject("Não foi possível abrir as permissões do Health Connect.")
                }
            } catch (error: Exception) {
                call.reject("Falha ao consultar permissões do Health Connect.", error)
            }
        }
    }

    @PluginMethod
    fun readSamples(call: PluginCall) {
        val hc = client ?: run {
            call.resolve(JSObject().put("samples", JSArray()))
            return
        }
        val types = stringValues(call.getArray("types") ?: JSArray())
        val since = call.getString("since")?.let(Instant::parse) ?: Instant.now().minusSeconds(30L * 24 * 60 * 60)
        val until = Instant.now()

        scope.launch {
            try {
                val samples = JSArray()
                for (type in types) {
                    when (type) {
                        "sleep" -> readSleep(hc, since, until, samples)
                        "heart-rate" -> readHeartRate(hc, since, until, samples)
                        "steps" -> readSteps(hc, since, until, samples)
                        "active-calories" -> readActiveCalories(hc, since, until, samples)
                        "exercise" -> readExercise(hc, since, until, samples)
                        "distance" -> readDistance(hc, since, until, samples)
                        "body-composition" -> readBodyFat(hc, since, until, samples)
                    }
                }
                call.resolve(JSObject().put("samples", samples))
            } catch (error: Exception) {
                call.reject("Falha ao ler dados do Health Connect.", error)
            }
        }
    }

    private fun stringValues(values: JSArray): List<String> {
        val result = mutableListOf<String>()
        for (index in 0 until values.length()) {
            val value = values.optString(index, "")
            if (value.isNotBlank()) result.add(value)
        }
        return result
    }

    private fun permissionsFor(types: JSArray): Set<String> = stringValues(types).mapNotNull { type ->
        when (type) {
            "sleep" -> HealthPermission.getReadPermission(SleepSessionRecord::class)
            "heart-rate" -> HealthPermission.getReadPermission(HeartRateRecord::class)
            "steps" -> HealthPermission.getReadPermission(StepsRecord::class)
            "active-calories" -> HealthPermission.getReadPermission(ActiveCaloriesBurnedRecord::class)
            "exercise" -> HealthPermission.getReadPermission(ExerciseSessionRecord::class)
            "distance" -> HealthPermission.getReadPermission(DistanceRecord::class)
            "body-composition" -> HealthPermission.getReadPermission(BodyFatRecord::class)
            else -> null
        }
    }.toSet()

    private suspend fun readSleep(client: HealthConnectClient, start: Instant, end: Instant, output: JSArray) {
        client.readRecords(ReadRecordsRequest(SleepSessionRecord::class, TimeRangeFilter.between(start, end))).records.forEach { record ->
            val minutes = (record.endTime.epochSecond - record.startTime.epochSecond) / 60.0
            output.put(sample("sleep", record.metadata.id, record.startTime, record.endTime, minutes, "min", record.metadata.dataOrigin.packageName))
        }
    }

    private suspend fun readHeartRate(client: HealthConnectClient, start: Instant, end: Instant, output: JSArray) {
        client.readRecords(ReadRecordsRequest(HeartRateRecord::class, TimeRangeFilter.between(start, end))).records.forEach { record ->
            record.samples.forEachIndexed { index, point ->
                output.put(sample("heart-rate", "${record.metadata.id}-$index", point.time, null, point.beatsPerMinute.toDouble(), "bpm", record.metadata.dataOrigin.packageName))
            }
        }
    }

    private suspend fun readSteps(client: HealthConnectClient, start: Instant, end: Instant, output: JSArray) {
        client.readRecords(ReadRecordsRequest(StepsRecord::class, TimeRangeFilter.between(start, end))).records.forEach { record ->
            output.put(sample("steps", record.metadata.id, record.startTime, record.endTime, record.count.toDouble(), "passos", record.metadata.dataOrigin.packageName))
        }
    }

    private suspend fun readActiveCalories(client: HealthConnectClient, start: Instant, end: Instant, output: JSArray) {
        client.readRecords(ReadRecordsRequest(ActiveCaloriesBurnedRecord::class, TimeRangeFilter.between(start, end))).records.forEach { record ->
            output.put(sample("active-calories", record.metadata.id, record.startTime, record.endTime, record.energy.inKilocalories, "kcal", record.metadata.dataOrigin.packageName))
        }
    }

    private suspend fun readExercise(client: HealthConnectClient, start: Instant, end: Instant, output: JSArray) {
        client.readRecords(ReadRecordsRequest(ExerciseSessionRecord::class, TimeRangeFilter.between(start, end))).records.forEach { record ->
            val minutes = (record.endTime.epochSecond - record.startTime.epochSecond) / 60.0
            output.put(
                sample("exercise", record.metadata.id, record.startTime, record.endTime, minutes, "min", record.metadata.dataOrigin.packageName)
                    .put("metadata", JSObject().put("exerciseType", record.exerciseType))
            )
        }
    }

    private suspend fun readDistance(client: HealthConnectClient, start: Instant, end: Instant, output: JSArray) {
        client.readRecords(ReadRecordsRequest(DistanceRecord::class, TimeRangeFilter.between(start, end))).records.forEach { record ->
            output.put(sample("distance", record.metadata.id, record.startTime, record.endTime, record.distance.inMeters, "m", record.metadata.dataOrigin.packageName))
        }
    }

    private suspend fun readBodyFat(client: HealthConnectClient, start: Instant, end: Instant, output: JSArray) {
        client.readRecords(ReadRecordsRequest(BodyFatRecord::class, TimeRangeFilter.between(start, end))).records.forEach { record ->
            output.put(sample("body-composition", record.metadata.id, record.time, null, record.percentage.value, "%", record.metadata.dataOrigin.packageName))
        }
    }

    private fun sample(type: String, id: String, start: Instant, end: Instant?, value: Double, unit: String, source: String): JSObject = JSObject()
        .put("id", "$type:$id")
        .put("type", type)
        .put("startedAt", start.toString())
        .put("endedAt", end?.toString())
        .put("value", value)
        .put("unit", unit)
        .put("source", source)
}
