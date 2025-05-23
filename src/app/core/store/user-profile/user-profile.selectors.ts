import { createFeatureSelector, createSelector } from '@ngrx/store';
import { UserProfileState } from './user-profile.reducer';
import { Select } from 'primeng/select';

export const selectUserProfileState = createFeatureSelector<UserProfileState>('userProfile');

export const selectUserConfig = createSelector(selectUserProfileState, (state) => state.userConfig);
export const selectUserLoading = createSelector(selectUserProfileState, (state) => state.loading);
export const selectUserRole = createSelector(selectUserProfileState, (state) => state.userConfig?.role);
export const getAssociatedBaranch = createSelector(selectUserProfileState, (state) => state.userConfig?.branch);
export const getToken = createSelector(selectUserProfileState, (state) => state.token);
export const getBranch = createSelector(selectUserProfileState, (state) => state.branch);
export const getAssociatedDepartments = createSelector(selectUserProfileState, (state) => state.userConfig.departments?.map((department:any)=>department));