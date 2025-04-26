import { createFeatureSelector, createSelector } from '@ngrx/store';
import { UserProfileState } from './user-profile.reducer';

export const selectUserProfileState = createFeatureSelector<UserProfileState>('userProfile');

export const selectUser = createSelector(selectUserProfileState, (state) => {
    return state.user;
});
export const selectUserLoading = createSelector(selectUserProfileState, (state) => state.loading);
export const selectUserRole = createSelector(selectUserProfileState, (state) => state.user?.role);
export const getToken = createSelector(selectUserProfileState, (state) => state.token);
