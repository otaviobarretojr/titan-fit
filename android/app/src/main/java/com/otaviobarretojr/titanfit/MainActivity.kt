package com.otaviobarretojr.titanfit

import android.os.Bundle
import com.getcapacitor.BridgeActivity
import com.otaviobarretojr.titanfit.health.TitanHealthConnectPlugin
import com.otaviobarretojr.titanfit.health.TitanSamsungHealthPlugin

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(TitanHealthConnectPlugin::class.java)
        registerPlugin(TitanSamsungHealthPlugin::class.java)
        super.onCreate(savedInstanceState)
    }
}
