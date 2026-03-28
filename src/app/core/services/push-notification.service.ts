import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Device } from '@capacitor/device'; // npm install @capacitor/device
import { ActionPerformed, PushNotifications, PushNotificationSchema, Token } from '@capacitor/push-notifications';
import { environment } from '../../../environments/environment.prod';
import { ApplicationConfigService } from './application-config.service';
import { CommonService } from './common.service';

@Injectable({
    providedIn: 'root'
})
export class PushNotificationService {
    // your backend URL
    protected readonly http = inject(HttpClient);
    protected readonly applicationConfigService = inject(ApplicationConfigService);
    protected commonService = inject(CommonService);
    protected resourceUrl = this.applicationConfigService.getEndpointFor(environment.ServerUrl + environment.NOTIFICATION_BASE_URL + 'fcm');

    async initPush() {
        const permission = await PushNotifications.checkPermissions();

        if (permission.receive === 'granted') {
            await PushNotifications.register();
        } else {
            const result = await PushNotifications.requestPermissions();

            if (result.receive === 'granted') {
                await PushNotifications.register();
            } else {
                console.warn('Push notification permission denied');
                return;
            }
        }

        this.registerListeners();
    }

    private registerListeners() {
        PushNotifications.addListener('registration', (token: Token) => {
            console.log('FCM Token:', token.value);
            localStorage.setItem('fcm_token', token.value);
            this.sendTokenToBackend(token.value);
        });

        PushNotifications.addListener('registrationError', (error: any) => {
            console.error('FCM Registration error:', error);
        });

        PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
            console.log('Notification received:', notification);
            // Show in-app alert or toast
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
            console.log('Notification tapped:', action.notification);
            // Navigate to specific page if needed
            const data = action.notification.data;
            if (data?.route) {
                // this.router.navigate([data.route]);
            }
        });
    }

    private async sendTokenToBackend(fcmToken: string) {
        const info = await Device.getId(); // unique device ID

        this.http
            .put(`${this.resourceUrl}/token`, {
                user_id: this.commonService.currentUser?.userId,
                fcm_token: fcmToken,
                device_id: info.identifier,
                device_type: 'ANDROID'
            })
            .subscribe({
                next: (res) => console.log('FCM token saved:', res),
                error: (err) => console.error('FCM token failed:', err)
            });
    }

    // private sendTokenToBackend(fcmToken: string) {
    //     this.http
    //         .put(`${this.resourceUrl}/fcm-token`, {
    //             user_id: this.commonService.currentUser?.id,
    //             fcm_token: fcmToken
    //         })
    //         .subscribe({
    //             next: (res) => console.log('FCM token sent to server:', res),
    //             error: (err) => console.error('Failed to send FCM token:', err)
    //         });
    // }
}
