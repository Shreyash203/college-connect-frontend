package dev.collegeconnect.preview.auth;

import android.os.Bundle;

import androidx.credentials.Credential;
import androidx.credentials.CredentialManager;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.CustomCredential;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.exceptions.GetCredentialException;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;

import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "GoogleAuth")
public class GoogleAuthPlugin extends Plugin {
    private static final String WEB_CLIENT_ID =
            "774747436427-57ign6kn9qt9tat4ipq7cnb04hio3rmn.apps.googleusercontent.com";
    private final Executor callbackExecutor = Executors.newSingleThreadExecutor();

    @PluginMethod
    public void signIn(PluginCall call) {
        GetSignInWithGoogleOption googleOption =
                new GetSignInWithGoogleOption.Builder(WEB_CLIENT_ID).build();
        GetCredentialRequest request = new GetCredentialRequest.Builder()
                .addCredentialOption(googleOption)
                .build();

        CredentialManager manager = CredentialManager.create(getContext());
        manager.getCredentialAsync(
                getActivity(),
                request,
                null,
                callbackExecutor,
                new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                    @Override
                    public void onResult(GetCredentialResponse response) {
                        try {
                            Credential credential = response.getCredential();
                            if (!(credential instanceof CustomCredential)
                                    || !GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL.equals(
                                            ((CustomCredential) credential).getType())) {
                                call.reject("Google did not return a valid ID token.");
                                return;
                            }
                            Bundle data = ((CustomCredential) credential).getData();
                            GoogleIdTokenCredential googleCredential =
                                    GoogleIdTokenCredential.createFrom(data);
                            JSObject result = new JSObject();
                            result.put("credential", googleCredential.getIdToken());
                            call.resolve(result);
                        } catch (Exception exception) {
                            call.reject("Could not read the Google sign-in credential.", exception);
                        }
                    }

                    @Override
                    public void onError(GetCredentialException exception) {
                        call.reject(exception.getMessage() == null
                                ? "Google sign-in was cancelled or unavailable."
                                : exception.getMessage(), exception);
                    }
                });
    }
}
