import { createFeatureSelector, createSelector } from '@ngrx/store';
import { UserProfileState } from './user-profile.reducer';
import { Section } from '../../../pages/models/org.model';
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

export const getSubByDeptIds = (departmentIds?: string[]) =>
  createSelector(
    selectUserProfileState,
    (state) => {
      const departments = state.userConfig?.departments ?? [];

      const filteredDepartments = !departmentIds || departmentIds.length === 0
        ? departments
        : departments.filter(dep => departmentIds.includes(dep.id));

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


export const getAllSectionEntities = createSelector(
  selectUserProfileState,
  (state): Section[] => {
    const departments = state.userConfig?.departments ?? [];

    const allSections: Section[] = [];

    departments.forEach(dep => {
      const departmentId = dep.id;
      const departmentName = dep.name;

      dep.department.classes?.forEach(cls => {
        const classId = cls.id;
        const className = cls.name;

        cls.sections?.forEach(section => {
          allSections.push({
            sectionId: section.id,
            sectionName: section.name,
            classId,
            className,
            departmentId,
            departmentName,
          });
        });
      });
    });

    return allSections;
  }
);
