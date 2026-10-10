import fs from 'fs';
const man='android/app/src/main/AndroidManifest.xml';
let m=fs.readFileSync(man,'utf8');
m=m.replace('android:allowBackup="true"','android:allowBackup="false"');
if(!m.includes('SCHEDULE_EXACT_ALARM'))m=m.replace('</manifest>','    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM"/>\n</manifest>');
fs.writeFileSync(man,m);
const dir='android/app/src/main/java/app/chakra/tracker';
// FLAG_SECURE hides the app in the recent-apps screen and blocks screenshots. Delete the setFlags line to allow screenshots.
fs.writeFileSync(dir+'/MainActivity.java',`package app.chakra.tracker;

import android.os.Bundle;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE);
    }
}
`);
console.log('Android project hardened: backups off, screen privacy on, exact alarms allowed.');
