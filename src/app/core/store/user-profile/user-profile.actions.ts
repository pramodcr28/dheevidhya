
import { createAction, props } from '@ngrx/store';
export const addToken = createAction('Token Added', props<{ token: string }>());
export const loadUserProfile = createAction('[UserProfile] Load', props<{ user: any }>());
export const loadUserAssociatedDepartments = createAction('[Departments] Load', props<{ departments: any[] }>());
export const loadUserProfileSuccess = createAction('[UserProfile] Load Success', props<{ user: any }>());
export const clearUserProfile = createAction('[UserProfile] Clear');
