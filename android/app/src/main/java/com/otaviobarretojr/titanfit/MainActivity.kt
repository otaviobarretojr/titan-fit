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

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        val webView = bridge.webView
        if (webView.canGoBack()) {
            webView.goBack()
            return
        }

        super.onBackPressed()
    }
}
