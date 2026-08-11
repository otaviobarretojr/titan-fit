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
import androidx.health.connect.client.records.NutritionRecord
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
import java.time.ZoneId
import java.time.ZonedDateTime
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
            val samples = JSArray()
            for (type in types) {
                try {
                    readMetric(hc, type, since, until, samples)
                } catch (_: Exception) {
                    // A falha de uma categoria não pode apagar dados válidos das demais.
                }
            }
            call.resolve(JSObject().put("samples", samples))
        }
    }

    @PluginMethod
    fun readDailyNutritionSummary(call: PluginCall) {
        val hc = client ?: run {
            call.resolve(emptyNutritionSummary())
            return
        }
        val zone = ZoneId.systemDefault()
        val now = ZonedDateTime.now(zone)
        val start = now.toLocalDate().atStartOfDay(zone).toInstant()
        val end = now.plusDays(1).toLocalDate().atStartOfDay(zone).toInstant()

        scope.launch {
            try {
                val rawRecords = hc.readRecords(
                    ReadRecordsRequest(NutritionRecord::class, TimeRangeFilter.between(start, end))
                ).records
                val records = deduplicateNutritionRecords(rawRecords)
                var calories = 0.0
                var protein = 0.0
                var carbohydrate = 0.0
                var fat = 0.0
                var fiber = 0.0
                val sources = linkedSetOf<String>()

                records.forEach { record ->
                    calories += record.energy?.inKilocalories ?: 0.0
                    protein += record.protein?.inGrams ?: 0.0
                    carbohydrate += record.totalCarbohydrate?.inGrams ?: 0.0
                    fat += record.totalFat?.inGrams ?: 0.0
                    fiber += record.dietaryFiber?.inGrams ?: 0.0
                    val source = record.metadata.dataOrigin.packageName
                    if (source.isNotBlank()) sources.add(source)
                }

                call.resolve(
                    JSObject()
                        .put("date", now.toLocalDate().toString())
                        .put("calories", calories)
                        .put("proteinGrams", protein)
                        .put("carbohydrateGrams", carbohydrate)
                        .put("fatGrams", fat)
                        .put("fiberGrams", fiber)
                        .put("records", records.size)
                        .put("rawRecords", rawRecords.size)
                        .put("duplicatesRemoved", rawRecords.size - records.size)
                        .put("sources", JSArray(sources.toList()))
                        .put("source", "health-connect")
                )
            } catch (error: Exception) {
                call.reject("Falha ao ler nutrição do Health Connect.", error)
            }
        }
    }

    @PluginMethod
    fun diagnoseHealthData(call: PluginCall) {
        val hc = client ?: run {
            call.resolve(
                JSObject()
                    .put("from", Instant.now().toString())
                    .put("to", Instant.now().toString())
                    .put("totalRecords", 0)
                    .put("metrics", JSArray())
            )
            return
        }
        val types = stringValues(call.getArray("types") ?: JSArray())
        val since = call.getString("since")?.let(Instant::parse) ?: Instant.now().minusSeconds(30L * 24 * 60 * 60)
        val until = Instant.now()

        scope.launch {
            val metrics = JSArray()
            var totalRecords = 0
            for (type in types) {
                val metricSamples = JSArray()
                val diagnostic = JSObject().put("type", type)
                try {
                    readMetric(hc, type, since, until, metricSamples)
                    val count = metricSamples.length()
                    totalRecords += count
                    diagnostic.put("count", count)
                    diagnostic.put("sources", sourcesOf(metricSamples))
                    val range = sampleRange(metricSamples)
                    range.first?.let { diagnostic.put("oldestAt", it) }
                    range.second?.let { diagnostic.put("newestAt", it) }
                } catch (error: Exception) {
                    diagnostic.put("count", 0)
                    diagnostic.put("sources", JSArray())
                    diagnostic.put("error", error.message ?: error.javaClass.simpleName)
                }
                metrics.put(diagnostic)
            }
            call.resolve(
                JSObject()
                    .put("from", since.toString())
                    .put("to", until.toString())
                    .put("totalRecords", totalRecords)
                    .put("metrics", metrics)
            )
        }
    }

    private fun emptyNutritionSummary(): JSObject = JSObject()
        .put("date", ZonedDateTime.now(ZoneId.systemDefault()).toLocalDate().toString())
        .put("calories", 0)
        .put("proteinGrams", 0)
        .put("carbohydrateGrams", 0)
        .put("fatGrams", 0)
        .put("fiberGrams", 0)
        .put("records", 0)
        .put("rawRecords", 0)
        .put("duplicatesRemoved", 0)
        .put("sources", JSArray())
        .put("source", "health-connect")

    private fun nutritionSignature(record: NutritionRecord): String = listOf(
        record.metadata.dataOrigin.packageName,
        record.startTime.toString(),
        record.endTime.toString(),
        record.name ?: "",
        record.energy?.inKilocalories ?: 0.0,
        record.protein?.inGrams ?: 0.0,
        record.totalCarbohydrate?.inGrams ?: 0.0,
        record.totalFat?.inGrams ?: 0.0,
        record.dietaryFiber?.inGrams ?: 0.0
    ).joinToString("|")

    private fun deduplicateNutritionRecords(records: List<NutritionRecord>): List<NutritionRecord> {
        val seen = linkedSetOf<String>()
        return records.filter { record -> seen.add(nutritionSignature(record)) }
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
            "nutrition" -> HealthPermission.getReadPermission(NutritionRecord::class)
            else -> null
        }
    }.toSet()

    private suspend fun readMetric(client: HealthConnectClient, type: String, start: Instant, end: Instant, output: JSArray) {
        when (type) {
            "sleep" -> readSleep(client, start, end, output)
            "heart-rate" -> readHeartRate(client, start, end, output)
            "steps" -> readSteps(client, start, end, output)
            "active-calories" -> readActiveCalories(client, start, end, output)
            "exercise" -> readExercise(client, start, end, output)
            "distance" -> readDistance(client, start, end, output)
            "body-composition" -> readBodyFat(client, start, end, output)
            "nutrition" -> readNutrition(client, start, end, output)
        }
    }

    private fun sourcesOf(samples: JSArray): JSArray {
        val sources = linkedSetOf<String>()
        for (index in 0 until samples.length()) {
            val source = samples.optJSONObject(index)?.optString("source", "") ?: ""
            if (source.isNotBlank()) sources.add(source)
        }
        return JSArray(sources.toList())
    }

    private fun sampleRange(samples: JSArray): Pair<String?, String?> {
        var oldest: String? = null
        var newest: String? = null
        for (index in 0 until samples.length()) {
            val startedAt = samples.optJSONObject(index)?.optString("startedAt", "") ?: ""
            if (startedAt.isBlank()) continue
            if (oldest == null || startedAt < oldest) oldest = startedAt
            if (newest == null || startedAt > newest) newest = startedAt
        }
        return Pair(oldest, newest)
    }

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

    private suspend fun readNutrition(client: HealthConnectClient, start: Instant, end: Instant, output: JSArray) {
        val rawRecords = client.readRecords(ReadRecordsRequest(NutritionRecord::class, TimeRangeFilter.between(start, end))).records
        deduplicateNutritionRecords(rawRecords).forEach { record ->
            output.put(
                sample("nutrition", record.metadata.id, record.startTime, record.endTime, record.energy?.inKilocalories ?: 0.0, "kcal", record.metadata.dataOrigin.packageName)
                    .put("metadata", JSObject()
                        .put("proteinGrams", record.protein?.inGrams ?: 0.0)
                        .put("carbohydrateGrams", record.totalCarbohydrate?.inGrams ?: 0.0)
                        .put("fatGrams", record.totalFat?.inGrams ?: 0.0)
                        .put("fiberGrams", record.dietaryFiber?.inGrams ?: 0.0)
                        .put("mealName", record.name)
                    )
            )
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
