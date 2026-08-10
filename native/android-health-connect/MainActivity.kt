package com.otaviobarretojr.titanfit

import android.os.Bundle
import com.getcapacitor.BridgeActivity
import com.otaviobarretojr.titanfit.health.TitanHealthConnectPlugin

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(TitanHealthConnectPlugin::class.java)
        super.onCreate(savedInstanceState)
    }
}
