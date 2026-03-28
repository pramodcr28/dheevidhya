


## 📱 Build Android App using Capacitor

---

### 🚀 Steps to Build

#### 1. Build Angular Project

```bash

ng build --configuration dev
```

---

#### 2. Sync with Capacitor

```bash
npx cap copy android
npx cap sync android
```

---

#### 3. Run in Android Emulator / Device

```bash
npx cap run android
```

---

### 🔄 Development Workflow

Whenever you make changes in Angular:

```bash
ng build --configuration prod
npx cap copy
npx cap run android
```

---

### 📦 Generate APK (Manual Build)

```bash
cd android
.\gradlew assembleDebug  // this will generate test apk , to upload to play store fallow separate process 
```

Output APK location:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

---

### ⚠️ Important Notes

* Always run Capacitor commands from the **project root**, not the `android/` folder
* For emulator, use backend URL:

```text
http://10.0.2.2:<port>
```

* For real device, use your system IP:

```text
http://192.168.x.x:<port>
```

---

### 🛠️ Troubleshooting

* If build fails, run:

```bash
cd android
.\gradlew clean
```

* Ensure `JAVA_HOME` is set correctly
* Ensure Android SDK is properly configured

---
