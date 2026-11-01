# Pereda for Android

A real-time daily note app for a phone: one note per day, written as it is typed. It is local — no account, no server, no network — and it declares no permission to reach one.

## Run it locally

```sh
cd apps/android
printf 'sdk.dir=%s\n' "$ANDROID_HOME" > local.properties   # once
./gradlew :app:assembleDebug
```

Needs JDK 21 and an Android SDK with platform 37; the app runs on Android 10 (API 29) or later. The APK lands in `app/build/outputs/apk/debug/app-debug.apk`.

## Usage

Open the app: today's note is at the top of the log with the caret in it, and the keyboard stays down until you tap. Type — every character is written within a moment, and there is no save button. Older days sit behind it; tap one to write in it, and delete from its bar. The magnifier searches the days before today.

The notes are one SQLite file in the app's own folder, `databases/pereda.db`, with the desktop's schema, so a copy of that file is the backup. Getting it on or off a phone has no screen yet.

## Checks

```sh
./gradlew :app:testDebugUnitTest
```

The tests run the store's SQL against a real SQLite (schema, triggers, migrations, FTS5), the live write and the log against a store in memory, and the screens through Robolectric. They do not start an emulator, so the app on a device is checked by hand.
