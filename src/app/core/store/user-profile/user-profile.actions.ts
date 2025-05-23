
import { createAction, props } from '@ngrx/store';
import { IBranch } from '../../../pages/models/tenant.model';
export const addToken = createAction('Token Added', props<{ token: string }>());
export const addBranch = createAction('Token Branch', props<{ branch: IBranch }>());
export const loadUserProfile = createAction('[UserProfile] Load', props<{ userConfig: any }>());
export const loadUserProfileSuccess = createAction('[UserProfile] Load Success', props<{ userConfig: any }>());
export const clearUserProfile = createAction('[UserProfile] Clear');
