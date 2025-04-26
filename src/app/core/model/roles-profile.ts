export interface IStudentProfile {
    rollNumber?: string | null;
    classId? : number | null;
      sectionId? : number | null;
  }

  export interface IGuardianProfile {
    childrens?: string | null;
    email?: string | null;
    contactNumber?: string | null;
  }

  
  export interface ITeacherProfile {}


  export interface ISubstituteTeacherProfile {}


  export interface ISportsCoachProfile {
    sportsManaged?: string | null;
  }

  
  export interface IProfessorProfile {
    researchAreas?: string | null;
    publications?: string | null;
  }

  
  export interface IPrincipalProfile {
    responsibilities?: string | null;
  }

  
  export interface ILecturerProfile {}

  export interface IITAdministratorProfile {
    responsibilities?: string | null;
  }

  export interface IHeadOfDepartmentProfile {
    responsibilities?: string | null;
  }

  export interface IHeadMasterProfile {
    responsibilities?: string | null;
  }

  
  export interface IVicePrincipalProfile {
    responsibilities?: string | null;
  }
  