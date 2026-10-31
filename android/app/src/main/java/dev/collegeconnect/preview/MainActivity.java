package dev.collegeconnect.preview;

import com.getcapacitor.BridgeActivity;
import dev.collegeconnect.preview.auth.GoogleAuthPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(GoogleAuthPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
