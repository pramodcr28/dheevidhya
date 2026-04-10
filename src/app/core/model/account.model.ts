export class Account {
    constructor(
        public activated: boolean,
        public authorities: string[],
        public email: string,
        public firstName: string | null,
        public langKey: string,
        public lastName: string | null,
        public login: string,
        public imageUrl: string | null
    ) {}
}

export interface SwitchAcademicYearDTO {
    profile: any;
    token: string;
}

export interface ContactLead {
    id?: string;
    fullName: string;
    institutionName: string;
    email: string;
    phone: string;
    studentRange: string;
    city: string;
    message: string;
    createdDate?: string;
    createdAt?: string;
}
