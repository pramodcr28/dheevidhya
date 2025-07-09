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

export const getSubjectsByFilters = (
  departmentIds: string[] = [],
  classIds: string[] = [],
  sectionIds: string[] = []
) =>
  createSelector(selectUserProfileState, (state) => {
    const departments = state.userConfig?.departments ?? [];

    const filteredDepartments = departmentIds.length
      ? departments.filter(dep => departmentIds.includes(dep.id))
      : departments;

    const subjects = filteredDepartments
      .flatMap(dep => dep.department.classes ?? [])
      .filter(cls => classIds.length === 0 || classIds.includes(cls.id))
      .flatMap(cls => cls.sections ?? [])
      .filter(sec => sectionIds.length === 0 || sectionIds.includes(sec.id))
      .flatMap(sec => sec.subjects ?? []);

    // Deduplicate by subject.id
    return Array.from(new Map(subjects.map(s => [s.id, s])).values());
  });


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
