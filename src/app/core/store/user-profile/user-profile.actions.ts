
import { createAction, props } from '@ngrx/store';
export const addToken = createAction('Token Added', props<{ token: string }>());
export const loadUserProfile = createAction('[UserProfile] Load', props<{ userConfig: any }>());
export const loadUserProfileSuccess = createAction('[UserProfile] Load Success', props<{ userConfig: any }>());
export const clearUserProfile = createAction('[UserProfile] Clear');
