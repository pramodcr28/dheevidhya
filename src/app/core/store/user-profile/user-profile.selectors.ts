import { createFeatureSelector, createSelector } from '@ngrx/store';
import { UserProfileState } from './user-profile.reducer';
export const selectUserProfileState = createFeatureSelector<UserProfileState>('userProfile');

export const selectUserConfig = createSelector(selectUserProfileState, (state) => state.userConfig);
export const selectUserLoading = createSelector(selectUserProfileState, (state) => state.loading);
export const selectUserRole = createSelector(selectUserProfileState, (state) => state.userConfig?.role);
// export const getAssociatedBaranch = createSelector(selectUserProfileState, (state) => state.userConfig?.branch);
export const getToken = createSelector(selectUserProfileState, (state) => state.token);
export const getBranch = createSelector(selectUserProfileState, (state) => state.branch);
export const getAssociatedDepartments = createSelector(selectUserProfileState, 
      (state) => state.userConfig?.departments.map((department: any) => {
        return { ...department, name: department.department?.name };
      }));

export const getSubByDeptIds = (departmentIds: string[]) =>
  createSelector(
    selectUserProfileState,
    (state) => {
      const departments = state.userConfig?.departments ?? [];

      const filteredDepartments = departments.filter(dep =>
        departmentIds.includes(dep.id)
      );

      const allSubjects: any[] = [];

      filteredDepartments.forEach(dep => {
        dep.department.classes?.forEach(cls => {
          cls.sections?.forEach(section => {
            allSubjects.push(...(section.subjects ?? []));
          });
        });
      });

      // Deduplicate by subject.id
      const uniqueSubjects = Object.values(
        allSubjects.reduce((acc, subject) => {
          if (!acc[subject.id]) {
            acc[subject.id] = subject;
          }
          return acc;
        }, {} as Record<string, any>)
      );

      return uniqueSubjects;
    }
  );
