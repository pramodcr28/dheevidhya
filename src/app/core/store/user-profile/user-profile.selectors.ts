import { createFeatureSelector, createSelector } from '@ngrx/store';
import { Section } from '../../../pages/models/org.model';
import { UserProfileState } from './user-profile.reducer';
export const selectUserProfileState = createFeatureSelector<UserProfileState>('userProfile');

export const selectUserConfig = createSelector(selectUserProfileState, (state) => state.userConfig);
export const selectUserLoading = createSelector(selectUserProfileState, (state) => state.loading);
export const selectUserTheme = createSelector(selectUserProfileState, (state) => state.selectedTheme);
export const selectUserRole = createSelector(selectUserProfileState, (state) => state.userConfig?.role);
// export const getAssociatedBaranch = createSelector(selectUserProfileState, (state) => state.userConfig?.branch);
export const getToken = createSelector(selectUserProfileState, (state) => state.token);
export const getBranch = createSelector(selectUserProfileState, (state) => state.branch);
export const getAuthorities = createSelector(selectUserProfileState, (state) => state.authorities ?? []);
export const getAssociatedDepartments = createSelector(selectUserProfileState, (state) =>
    state.userConfig?.departments.map((department: any) => {
        return { ...department, name: department.department?.name };
    })
);

export const getDepartmentById = (id: string) => createSelector(getAssociatedDepartments, (departments) => departments?.find((department) => department.id === id));
export const getStudentSectionByIds = (departmentId: string, classId: string, sectionId: string) =>
    createSelector(getDepartmentById(departmentId), (department) => {
        if (!department?.department?.classes) {
            return null;
        }

        const cls = department.department.classes.find((c: any) => c.id === classId);

        if (!cls?.sections) {
            return null;
        }

        return cls.sections.find((s: any) => s.id === sectionId) ?? null;
    });

export const getUserAssociatedSubjects = createSelector(selectUserProfileState, (state) => {
    const userConfig = state.userConfig ?? {};
    const subjectIds = userConfig.subjectIds ?? [];
    const departments = userConfig.departments ?? [];
    const studentRole = userConfig.roles?.student;

    // Collect all subjects from all departments
    const allSubjects = departments
        .flatMap((dep) => dep.department.classes ?? [])
        .flatMap((cls) => cls.sections ?? [])
        .flatMap((sec) => sec.subjects ?? []);

    //  If user is a student → get all subjects for their class + section
    if (studentRole?.sectionId && studentRole?.classId) {
        const { classId, sectionId } = studentRole;

        return departments
            .flatMap((dep) => dep.department.classes ?? [])
            .filter((cls) => cls.id === classId)
            .flatMap((cls) => cls.sections ?? [])
            .filter((sec) => sec.id === sectionId)
            .flatMap((sec) => sec.subjects ?? []);
    }

    // Otherwise → return only subjects mapped to their subjectIds (e.g. for teachers/admins)
    return allSubjects.filter((sub) => subjectIds?.includes(sub.id));
});

export const getSubjectsByFilters = (departmentIds: string[] = [], classIds: string[] = [], sectionIds: string[] = []) =>
    createSelector(selectUserProfileState, (state) => {
        const departments = state.userConfig?.departments ?? [];

        const filteredDepartments = departmentIds.length ? departments.filter((dep) => departmentIds.includes(dep.id)) : departments;

        const subjects = filteredDepartments
            .flatMap((dep) => dep.department.classes ?? [])
            .filter((cls) => classIds.length === 0 || classIds.includes(cls.id))
            .flatMap((cls) => cls.sections ?? [])
            .filter((sec) => sectionIds.length === 0 || sectionIds.includes(sec.id))
            .flatMap((sec) => sec.subjects ?? []);

        // Deduplicate by subject.id
        return Array.from(new Map(subjects.map((s) => [s.id, s])).values());
    });

export const getAllSectionEntities = createSelector(selectUserProfileState, (state): Section[] => {
    const departments = state.userConfig?.departments ?? [];

    const allSections: Section[] = [];

    departments.forEach((dep) => {
        const departmentId = dep.id;
        const departmentName = dep.name;

        dep.department.classes?.forEach((cls) => {
            const classId = cls.id;
            const className = cls.name;

            cls.sections?.forEach((section) => {
                allSections.push({
                    sectionId: section.id,
                    sectionName: section.name,
                    classId,
                    className,
                    departmentId,
                    departmentName
                });
            });
        });
    });

    return allSections;
});
