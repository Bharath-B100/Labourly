package expo.modules.labourlygoogle

import android.content.MutableContextWrapper
import androidx.credentials.*
import androidx.credentials.exceptions.GetCredentialCancellationException
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.functions.Coroutine
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.concurrent.atomic.AtomicBoolean

class LabourlyGoogleModule : Module() {
  private val busy = AtomicBoolean(false)
  override fun definition() = ModuleDefinition {
    Name("LabourlyGoogle")
    AsyncFunction("signIn") Coroutine { clientId: String, nonce: String ->
      require(clientId.endsWith(".apps.googleusercontent.com")) { "Invalid Google client configuration" }
      require(nonce.matches(Regex("[a-f0-9]{64}"))) { "Invalid sign-in challenge" }
      check(busy.compareAndSet(false, true)) { "Sign-in is already in progress" }
      try {
        withContext(Dispatchers.Main) {
          val activity = appContext.currentActivity ?: error("Open the app before signing in")
          val manager = CredentialManager.create(activity)
          val option = GetSignInWithGoogleOption.Builder(clientId).setNonce(nonce).build()
          val request = GetCredentialRequest.Builder().addCredentialOption(option).build()
          try {
            val credential = manager.getCredential(MutableContextWrapper(activity), request).credential
            check(credential is CustomCredential && credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) { "Unexpected sign-in response" }
            mapOf("idToken" to GoogleIdTokenCredential.createFrom(credential.data).idToken, "cancelled" to false)
          } catch (e: GetCredentialCancellationException) {
            mapOf("cancelled" to true)
          }
        }
      } finally { busy.set(false) }
    }
    AsyncFunction("clearSession") Coroutine { ->
      val context = appContext.reactContext ?: return@Coroutine
      CredentialManager.create(context).clearCredentialState(ClearCredentialStateRequest())
    }
  }
}
