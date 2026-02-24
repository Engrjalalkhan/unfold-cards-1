@echo off
echo Building Release APK with Logo Icon...
echo.

cd android
echo Cleaning previous build...
call gradlew.bat clean

echo.
echo Building release APK...
call gradlew.bat assembleRelease

echo.
echo Build completed!
echo APK Location: android\app\build\outputs\apk\release\app-release.apk
echo.

pause
