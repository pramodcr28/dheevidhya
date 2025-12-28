import dayjs from 'dayjs/esm';

export enum BranchType {
    HQ = 'HQ',

    BRANCH = 'BRANCH'
}
export enum TenantStatus {
    ACTIVE = 'ACTIVE',

    INACTIVE = 'INACTIVE'
}

export interface ITenant {
    id?: number;
    name?: string | null;
    desc?: string | null;
    regNo?: string | null;
    taxId?: string | null;
    estDate?: dayjs.Dayjs | null;
    web?: string | null;
    email?: string | null;
    phone?: string | null;
    status?: keyof typeof TenantStatus | null;
}

export interface IBranch {
    id: number;
    name?: string | null;
    code?: string | null;
    type?: keyof typeof BranchType | null;
    board?: string | null;
    phone?: string | null;
    email?: string | null;
    street?: string | null;
    locality?: string | null;
    landmark?: string | null;
    taluk?: string | null;
    district?: string | null;
    state?: string | null;
    country?: string | null;
    postalCode?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    active?: boolean | null;
    createdBy?: string | null;
    createdAt?: dayjs.Dayjs | null;
    updatedBy?: string | null;
    updatedAt?: dayjs.Dayjs | null;
    tenant?: ITenant | null;
}

export type NewBranch = Omit<IBranch, 'id'> & { id: null };
