package com.otaviobarretojr.titanfit.health

import android.os.Build
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.samsung.android.sdk.health.data.HealthDataService
import com.samsung.android.sdk.health.data.permission.AccessType
import com.samsung.android.sdk.health.data.permission.Permission
import com.samsung.android.sdk.health.data.request.DataType
import com.samsung.android.sdk.health.data.request.DataTypes
import com.samsung.android.sdk.health.data.request.LocalTimeFilter
import java.time.LocalDate
import java.time.LocalDateTime
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

@CapacitorPlugin(name = "TitanSamsungHealth")
class TitanSamsungHealthPlugin : Plugin() {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    private val requiredPermissions: Set<Permission>
        get() = setOf(
            Permission.of(DataTypes.STEPS, AccessType.READ),
            Permission.of(DataTypes.ACTIVITY_SUMMARY, AccessType.READ),
            Permission.of(DataTypes.HEART_RATE, AccessType.READ),
            Permission.of(DataTypes.SLEEP, AccessType.READ),
        )

    override fun handleOnDestroy() {
        scope.cancel()
        super.handleOnDestroy()
    }

    private fun errorMessage(error: Throwable): String =
        error.message?.takeIf { it.isNotBlank() } ?: error.javaClass.simpleName

    @PluginMethod
    fun isAvailable(call: PluginCall) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            call.resolve(JSObject().put("available", false).put("granted", false).put("message", "Samsung Health Data SDK requer Android 10 ou superior."))
            return
        }
        scope.launch {
            try {
                val store = HealthDataService.getStore(context.applicationContext)
                val granted = store.getGrantedPermissions(requiredPermissions).containsAll(requiredPermissions)
                call.resolve(JSObject().put("available", true).put("granted", granted).put("message", if (granted) "Samsung Health autorizado." else "Samsung Health disponível, aguardando autorização para atividade, sono e frequência cardíaca."))
            } catch (error: Exception) {
                call.resolve(JSObject().put("available", false).put("granted", false).put("message", "SDK Samsung Health indisponível: ${errorMessage(error)}"))
            }
        }
    }

    @PluginMethod
    fun requestSamsungHealthPermissions(call: PluginCall) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            call.resolve(JSObject().put("granted", false).put("message", "Samsung Health Data SDK requer Android 10 ou superior."))
            return
        }
        scope.launch {
            try {
                val store = HealthDataService.getStore(context.applicationContext)
                val existing = store.getGrantedPermissions(requiredPermissions)
                val granted = if (existing.containsAll(requiredPermissions)) existing else store.requestPermissions(requiredPermissions, activity)
                val allGranted = granted.containsAll(requiredPermissions)
                call.resolve(JSObject().put("granted", allGranted).put("message", if (allGranted) "Samsung Health autorizado para atividade, sono e frequência cardíaca." else "A autorização completa do Samsung Health não foi concedida."))
            } catch (error: Exception) {
                call.resolve(JSObject().put("granted", false).put("message", "Falha ao abrir autorização Samsung Health: ${errorMessage(error)}"))
            }
        }
    }

    @PluginMethod
    fun readDailyActivitySummary(call: PluginCall) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            call.reject("Samsung Health Data SDK requer Android 10 ou superior.")
            return
        }
        scope.launch {
            try {
                val store = HealthDataService.getStore(context.applicationContext)
                val granted = store.getGrantedPermissions(requiredPermissions)
                if (!granted.contains(Permission.of(DataTypes.STEPS, AccessType.READ)) || !granted.contains(Permission.of(DataTypes.ACTIVITY_SUMMARY, AccessType.READ))) {
                    call.reject("Permissões de atividade do Samsung Health ainda não concedidas.")
                    return@launch
                }

                val filter = LocalTimeFilter.of(LocalDate.now().atStartOfDay(), LocalDateTime.now())
                val stepsRequest = DataType.StepsType.TOTAL.requestBuilder.setLocalTimeFilter(filter).build()
                val activeTimeRequest = DataType.ActivitySummaryType.TOTAL_ACTIVE_TIME.requestBuilder.setLocalTimeFilter(filter).build()
                val activeCaloriesRequest = DataType.ActivitySummaryType.TOTAL_ACTIVE_CALORIES_BURNED.requestBuilder.setLocalTimeFilter(filter).build()
                val distanceRequest = DataType.ActivitySummaryType.TOTAL_DISTANCE.requestBuilder.setLocalTimeFilter(filter).build()

                val steps = store.aggregateData(stepsRequest).dataList.sumOf { it.value ?: 0L }
                val activeMinutes = store.aggregateData(activeTimeRequest).dataList.mapNotNull { it.value }.fold(java.time.Duration.ZERO) { total, duration -> total.plus(duration) }.toMinutes()
                val activeCalories = store.aggregateData(activeCaloriesRequest).dataList.mapNotNull { it.value }.sum()
                val distanceMeters = store.aggregateData(distanceRequest).dataList.mapNotNull { it.value }.sum()

                call.resolve(JSObject().put("date", LocalDate.now().toString()).put("steps", steps).put("activeMinutes", activeMinutes).put("activeCalories", activeCalories).put("distanceMeters", distanceMeters).put("activeMinutesSource", "activity-summary").put("source", "samsung-health"))
            } catch (error: Exception) {
                call.reject("Falha ao ler o resumo diário do Samsung Health: ${errorMessage(error)}", error)
            }
        }
    }

    @PluginMethod
    fun readRecentSignals(call: PluginCall) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            call.resolve(JSObject().put("samples", JSArray()))
            return
        }
        scope.launch {
            val samples = JSArray()
            try {
                val store = HealthDataService.getStore(context.applicationContext)
                val granted = store.getGrantedPermissions(requiredPermissions)

                if (granted.contains(Permission.of(DataTypes.HEART_RATE, AccessType.READ))) {
                    val hrFilter = LocalTimeFilter.of(LocalDateTime.now().minusHours(6), LocalDateTime.now())
                    val request = DataTypes.HEART_RATE.readDataRequestBuilder.setLocalTimeFilter(hrFilter).build()
                    store.readData(request).dataList.forEach { point ->
                        point.getValue(DataType.HeartRateType.HEART_RATE)?.let { bpm ->
                            samples.put(JSObject().put("id", "samsung-hr-${point.uid}").put("type", "heart-rate").put("startedAt", point.startTime.toString()).put("endedAt", point.endTime?.toString()).put("value", bpm.toDouble()).put("unit", "bpm").put("source", "samsung-health-direct"))
                        }
                    }
                }

                if (granted.contains(Permission.of(DataTypes.SLEEP, AccessType.READ))) {
                    val sleepFilter = LocalTimeFilter.of(LocalDateTime.now().minusHours(36), LocalDateTime.now())
                    val request = DataTypes.SLEEP.readDataRequestBuilder.setLocalTimeFilter(sleepFilter).build()
                    store.readData(request).dataList.forEach { point ->
                        point.getValue(DataType.SleepType.DURATION)?.let { duration ->
                            samples.put(JSObject().put("id", "samsung-sleep-${point.uid}").put("type", "sleep").put("startedAt", point.startTime.toString()).put("endedAt", point.endTime?.toString()).put("value", duration.toMinutes().toDouble()).put("unit", "min").put("source", "samsung-health-direct"))
                        }
                    }
                }
                call.resolve(JSObject().put("samples", samples))
            } catch (error: Exception) {
                call.reject("Falha ao ler sinais recentes do Samsung Health: ${errorMessage(error)}", error)
            }
        }
    }
}
