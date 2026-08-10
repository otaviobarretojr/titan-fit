package com.otaviobarretojr.titanfit

import android.app.Activity
import android.os.Bundle
import android.text.method.LinkMovementMethod
import android.view.Gravity
import android.view.ViewGroup
import android.widget.LinearLayout
import android.widget.TextView

class PermissionsRationaleActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val padding = (24 * resources.displayMetrics.density).toInt()
        val container = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(padding, padding, padding, padding)
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT,
            )
        }

        container.addView(TextView(this).apply {
            text = "TITAN FIT · Dados de saúde"
            textSize = 24f
        })
        container.addView(TextView(this).apply {
            text = "\nO TITAN FIT solicita acesso somente de leitura aos dados escolhidos no Health Connect para exibir seu painel de saúde e apoiar análises de treino e recuperação.\n\nOs dados sincronizados ficam armazenados no próprio aplicativo e não são vendidos nem usados para publicidade. Você pode revogar o acesso a qualquer momento nas configurações do Health Connect."
            textSize = 16f
            movementMethod = LinkMovementMethod.getInstance()
        })

        setContentView(container)
    }
}
