import { Geolocation, Position } from '@capacitor/geolocation';
import { Preferences } from '@capacitor/preferences';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';

export const isNativePlatform = (): boolean => {
    return Capacitor.isNativePlatform();
};

export const initializeNativeApp = async (): Promise<void> => {
    if (!isNativePlatform()) return;

    try {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#0F2747' });
    } catch (e) {
        console.warn('[Native App] StatusBar initialization skipped:', e);
    }

    try {
        await SplashScreen.hide();
    } catch (e) {
        console.warn('[Native App] SplashScreen hide skipped:', e);
    }
};

export const getDeviceCurrentPosition = async (): Promise<{ latitude: number; longitude: number } | null> => {
    try {
        const position: Position = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 10000,
        });
        return {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
        };
    } catch (error) {
        console.warn('[Native App] Geolocation error or permission denied:', error);
        return null;
    }
};

export const setOfflinePreference = async (key: string, value: any): Promise<void> => {
    try {
        await Preferences.set({
            key,
            value: typeof value === 'string' ? value : JSON.stringify(value),
        });
    } catch (error) {
        console.warn(`[Native App] Failed to save offline preference for ${key}:`, error);
    }
};

export const getOfflinePreference = async <T = any>(key: string): Promise<T | null> => {
    try {
        const result = await Preferences.get({ key });
        if (!result.value) return null;
        try {
            return JSON.parse(result.value) as T;
        } catch {
            return result.value as unknown as T;
        }
    } catch (error) {
        console.warn(`[Native App] Failed to retrieve offline preference for ${key}:`, error);
        return null;
    }
};
