package com.otaviobarretojr.titanfit.health

import android.os.Build
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
            call.resolve(
                JSObject()
                    .put("available", false)
                    .put("granted", false)
                    .put("message", "Samsung Health Data SDK requer Android 10 ou superior.")
            )
            return
        }
        scope.launch {
            try {
                val store = HealthDataService.getStore(context.applicationContext)
                val granted = store.getGrantedPermissions(requiredPermissions).containsAll(requiredPermissions)
                call.resolve(
                    JSObject()
                        .put("available", true)
                        .put("granted", granted)
                        .put("message", if (granted) "Samsung Health autorizado." else "Samsung Health disponível, aguardando autorização.")
                )
            } catch (error: Exception) {
                call.resolve(
                    JSObject()
                        .put("available", false)
                        .put("granted", false)
                        .put("message", "SDK Samsung Health indisponível: ${errorMessage(error)}")
                )
            }
        }
    }

    @PluginMethod
    fun requestSamsungHealthPermissions(call: PluginCall) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            call.resolve(
                JSObject()
                    .put("granted", false)
                    .put("message", "Samsung Health Data SDK requer Android 10 ou superior.")
            )
            return
        }
        scope.launch {
            try {
                val store = HealthDataService.getStore(context.applicationContext)
                val existing = store.getGrantedPermissions(requiredPermissions)
                val granted = if (existing.containsAll(requiredPermissions)) {
                    existing
                } else {
                    store.requestPermissions(requiredPermissions, activity)
                }
                val allGranted = granted.containsAll(requiredPermissions)
                call.resolve(
                    JSObject()
                        .put("granted", allGranted)
                        .put("message", if (allGranted) "Samsung Health autorizado." else "A autorização do Samsung Health não foi concedida.")
                )
            } catch (error: Exception) {
                call.resolve(
                    JSObject()
                        .put("granted", false)
                        .put("message", "Falha ao abrir autorização Samsung Health: ${errorMessage(error)}")
                )
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
                if (!granted.containsAll(requiredPermissions)) {
                    call.reject("Permissão do Samsung Health ainda não concedida.")
                    return@launch
                }

                val start = LocalDate.now().atStartOfDay()
                val end = LocalDateTime.now()
                val filter = LocalTimeFilter.of(start, end)

                val stepsRequest = DataType.StepsType.TOTAL.requestBuilder
                    .setLocalTimeFilter(filter)
                    .build()
                val activeTimeRequest = DataType.ActivitySummaryType.TOTAL_ACTIVE_TIME.requestBuilder
                    .setLocalTimeFilter(filter)
                    .build()
                val activeCaloriesRequest = DataType.ActivitySummaryType.TOTAL_ACTIVE_CALORIES_BURNED.requestBuilder
                    .setLocalTimeFilter(filter)
                    .build()
                val distanceRequest = DataType.ActivitySummaryType.TOTAL_DISTANCE.requestBuilder
                    .setLocalTimeFilter(filter)
                    .build()

                val steps = store.aggregateData(stepsRequest).dataList.sumOf { it.value ?: 0L }
                val activeMinutes = store.aggregateData(activeTimeRequest).dataList
                    .mapNotNull { it.value }
                    .fold(java.time.Duration.ZERO) { total, duration -> total.plus(duration) }
                    .toMinutes()
                val activeCalories = store.aggregateData(activeCaloriesRequest).dataList
                    .mapNotNull { it.value }
                    .sum()
                val distanceMeters = store.aggregateData(distanceRequest).dataList
                    .mapNotNull { it.value }
                    .sum()

                call.resolve(
                    JSObject()
                        .put("date", LocalDate.now().toString())
                        .put("steps", steps)
                        .put("activeMinutes", activeMinutes)
                        .put("activeCalories", activeCalories)
                        .put("distanceMeters", distanceMeters)
                        .put("activeMinutesSource", "activity-summary")
                        .put("source", "samsung-health")
                )
            } catch (error: Exception) {
                call.reject("Falha ao ler o resumo diário do Samsung Health: ${errorMessage(error)}", error)
            }
        }
    }
}
