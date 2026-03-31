import { Action, createReducer, MetaReducer, on } from '@ngrx/store';
import { IBranch } from '../../../pages/models/tenant.model';
import * as UserProfileActions from './user-profile.actions';
import { setTheme } from './user-profile.actions';

export interface UserProfileState {
    userConfig: any;
    loading: boolean;
    isAuthenticated: boolean;
    token: string | null;
    authorities?: string[];
    branch: IBranch | null;
    selectedTheme?: 'light' | 'dark';
}

export const localStorageKey = 'userProfileState';

export const initialState: UserProfileState = (() => {
    const savedState = localStorage.getItem(localStorageKey);
    return savedState
        ? JSON.parse(savedState)
        : {
              userConfig: null,
              loading: false,
              isAuthenticated: false,
              token: null,
              authorities: [],
              branch: null,
              selectedTheme: 'dark' as const
          };
})();

export const userProfileReducer = createReducer(
    initialState,
    on(UserProfileActions.loadUserProfile, (state, { userConfig }) => ({
        ...state,
        userConfig,
        loading: true
    })),
    on(UserProfileActions.loadUserProfileSuccess, (state, { userConfig }) => ({
        ...state,
        userConfig,
        loading: false,
        isAuthenticated: true
    })),
    on(UserProfileActions.clearUserProfile, () => ({
        userConfig: null,
        loading: false,
        isAuthenticated: false,
        token: null,
        branch: null,
        selectedTheme: 'dark' as const
    })),
    on(UserProfileActions.addToken, (state, { token }) => ({
        ...state,
        token,
        loading: false,
        isAuthenticated: true
    })),
    on(UserProfileActions.addAuthorities, (state, { authorities }) => ({
        ...state,
        authorities,
        loading: false,
        isAuthenticated: true
    })),
    on(UserProfileActions.addBranch, (state, { branch }) => ({
        ...state,
        branch,
        loading: false,
        isAuthenticated: true
    })),
    on(setTheme, (state, { theme }) => ({
        ...state,
        selectedTheme: theme
    }))
);

export function localStorageMetaReducer(reducer: (state: { userProfile: UserProfileState } | undefined, action: Action) => any): (state: { userProfile: UserProfileState } | undefined, action: Action) => any {
    return function (state, action) {
        const newState = reducer(state, action);

        if (newState?.userProfile) {
            localStorage.setItem(localStorageKey, JSON.stringify(newState.userProfile));
        }

        return newState;
    };
}

export const metaReducers: MetaReducer<{ userProfile: UserProfileState }>[] = [localStorageMetaReducer];
