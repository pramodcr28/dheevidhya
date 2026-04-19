import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApplicationConfigService } from '../../core/services/application-config.service';
import { CommonService } from '../../core/services/common.service';
import { UserProfileState } from '../../core/store/user-profile/user-profile.reducer';
import { getSubjectsByFilters } from '../../core/store/user-profile/user-profile.selectors';
import { InstructorSlotRequest, Teacher, TimeTable } from '../models/time-table';
import { ProfileConfigService } from './profile-config.service';
import { UserService } from './user.service';

@Injectable({
    providedIn: 'root'
})
export class TimeTableService {
    private http = inject(HttpClient);
    private store = inject(Store<{ userProfile: UserProfileState }>);
    private userService = inject(UserService);
    private profileService = inject(ProfileConfigService);
    private applicationConfigService = inject(ApplicationConfigService);
    private commonService = inject(CommonService);
    public teachers: Teacher[] = [];
    public teacherslots: any[] = [];
    public classes: any[] = [];
    public timeTable: TimeTable = {
        department: null,
        settings: {
            academicYear: null,
            semester: 'fall',
            workingDays: [
                { name: 'Sun', selected: false },
                { name: 'Mon', selected: true },
                { name: 'Tue', selected: true },
                { name: 'Wed', selected: true },
                { name: 'Thu', selected: true },
                { name: 'Fri', selected: true },
                { name: 'Sat', selected: false }
            ],
            startTime: '08:00',
            endTime: '16:00',
            periodDuration: 45,
            breakDuration: 10,
            periodsPerDay: 7,
            breaks: [
                {
                    id: 'tea_break',
                    name: 'Tea Break',
                    afterPeriod: 2,
                    duration: 15,
                    enabled: false
                },
                {
                    id: 'lunch_break',
                    name: 'Lunch Break',
                    afterPeriod: 4,
                    duration: 45,
                    enabled: false
                }
            ]
        },
        schedule: {}
    };

    readonly periods = ['Period 1', 'Period 2', 'Period 3', 'Period 4', 'Period 5', 'Period 6', 'Period 7', 'Period 8', 'Period 9'];

    private resourceUrl = this.applicationConfigService.getEndpointFor(environment.ServerUrl + environment.ADMIN_BASE_URL + 'api/timetables');

    create(timeTable: any) {
        return this.http.post(this.resourceUrl, timeTable);
    }

    update(timeTable: any, id: string) {
        return this.http.put(this.resourceUrl + '/' + id, timeTable);
    }

    fetchTimeTables() {
        return this.http.get(this.resourceUrl);
    }

    search<T>(page: number = 0, size: number = 10, sortBy: string = 'id', sortDirection: string = 'ASC', filters: any = {}): Observable<any> {
        const searchRequest = {
            page: page,
            size: size,
            sortBy: sortBy,
            sortDirection: sortDirection,
            filters: filters
        };

        return this.http.post<any>(`${this.resourceUrl}/search`, searchRequest);
    }

    deleteTimeTable(id: string) {
        return this.http.delete(`${this.resourceUrl}/${id}`);
    }

    generateTimeTable(request: any) {
        if (environment.stage != 'local') return this.http.post('https://dheevidhya.in/v3ai/generate-timetable', request);
        else return this.http.post('http://localhost:8084/generate-timetable', request);
    }

    updateStatus(timetableId: string, newStatus: string) {
        return this.http.post(`${this.resourceUrl}/${timetableId}/status`, { status: newStatus });
    }

    getTeachersList(): Teacher[] {
        return this.teachers;
    }

    getTeachersWithAvailability() {
        this.teachers.forEach((teacher) => {
            const teacherSlots = this.teacherslots.filter((s: any) => s.instructorId == teacher.id);
            teacher.unavailable_periods = teacherSlots
                ? teacherSlots
                      .map((s) => {
                          let dayIndex = Number(s.dayIndex);
                          let periodIndex = this.getPeriodIndexByStartAndEndTime(s.startTime, s.endTime);

                          return [(dayIndex = Number(s.dayIndex)), periodIndex];
                      })
                      .filter((t) => t[1] != -1)
                : [];
        });

        return this.teachers;
    }

    onDepartmentChange() {
        this.timeTable.settings.academicYear = this.timeTable.department.academicYear;
        this.classes = [];
        const uniqueSubjectIds = new Set<string>();
        this.timeTable.department.department.classes.forEach((cls) => {
            cls.sections.forEach((section: any) => {
                this.classes.push({
                    id: cls.id + '-' + section.id,
                    name: `${cls.name}-${section.name}`,
                    subjects: section.subjects.map((sub: any) => {
                        uniqueSubjectIds.add(sub.id);
                        return {
                            id: sub.id,
                            name: sub.name,
                            teacher_id: sub.teacher,
                            hours_per_week: sub.periodsPerWeek
                        };
                    })
                });
            });
        });
        const uniqueSubjectIdList: string[] = Array.from(uniqueSubjectIds);
        this.store.select(getSubjectsByFilters([this.timeTable.department.id])).subscribe((subjects) => {
            this.profileService
                .search(0, 100, 'id', 'ASC', {
                    'profileType.equals': 'STAFF',
                    'departments.in': [this.timeTable.department.id],
                    'subject_ids.in': [...uniqueSubjectIdList]
                })
                .subscribe((res: any) => {
                    this.teachers = res.content.map((profile: any) => ({
                        name: profile.fullName,
                        id: profile.userId,
                        timeOff: [],
                        timeOn: []
                    }));
                    let request = {
                        academicYear: this.timeTable.settings.academicYear,
                        instructorIds: [...this.teachers.map((t) => t.id)],
                        departmentId: this.timeTable.department.id,
                        scheduleDay: null
                    };
                    this.teacherslots = [];
                    this.getInstructorSlots(request).subscribe((slots) => {
                        this.teacherslots = slots;
                    });
                });
        });
    }

    togglePeriodAvailability(teacherId: string, day, periodIndex: number) {
        const teacher = this.teachers.find((teacher) => teacher.id === teacherId);
        if (!teacher) return;
        let dayIndex = this.timeTable.settings.workingDays?.findIndex((wd) => wd.name == day.name);
        const key: [number, number] = [dayIndex, periodIndex];
        const keyStr = key.toString();

        const onIndex = teacher.timeOn.findIndex((t) => t.toString() === keyStr);
        const offIndex = teacher.timeOff.findIndex((t) => t.toString() === keyStr);

        if (onIndex !== -1) {
            teacher.timeOn.splice(onIndex, 1);
            teacher.timeOff.push(key);
        } else if (offIndex !== -1) {
            teacher.timeOff.splice(offIndex, 1);
        } else {
            teacher.timeOn.push(key);
        }
    }

    getPeriodStatus(teacher: Teacher, day, periodIndex: number): 'available' | 'unavailable' | 'neutral' {
        let dayIndex = this.timeTable.settings.workingDays?.findIndex((wd) => wd.name == day.name);
        const isAvailable = teacher.timeOn.some((t) => t[0] === dayIndex && t[1] === periodIndex);
        const isUnavailable = teacher.timeOff.some((t) => t[0] === dayIndex && t[1] === periodIndex);

        if (isAvailable) return 'available';
        if (isUnavailable) return 'unavailable';
        return 'neutral';
    }

    getAvailabilitySummary(teacher: Teacher) {
        const workingDays = this.timeTable.settings.workingDays.filter((d) => d.selected);
        const totalSlots = workingDays.length * this.timeTable.settings.periodsPerDay;

        return {
            available: teacher?.timeOn.length,
            unavailable: teacher?.timeOff.length,
            neutral: totalSlots - teacher?.timeOn.length - teacher?.timeOff.length
        };
    }

    resetTimeTable() {
        this.timeTable = {
            department: null,
            settings: {
                academicYear: null,
                semester: 'fall',
                workingDays: [
                    { name: 'Sun', selected: false },
                    { name: 'Mon', selected: true },
                    { name: 'Tue', selected: true },
                    { name: 'Wed', selected: true },
                    { name: 'Thu', selected: true },
                    { name: 'Fri', selected: true },
                    { name: 'Sat', selected: false }
                ],
                startTime: '08:00',
                endTime: '16:00',
                periodDuration: 45,
                breakDuration: 10,
                periodsPerDay: 7
            },
            schedule: {}
        };
    }

    private toMinutes(timeStr: string): number {
        if (!timeStr) return 0;
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }

    getPeriodIndexByStartAndEndTime(startTime: string, endTime: string): number {
        const settings = this.timeTable.settings;
        const enabledBreaks = (settings.breaks || []).filter((b) => b.enabled).sort((a, b) => a.afterPeriod - b.afterPeriod);
        debugger;
        const dayStartMinutes = this.toMinutes(settings.startTime);
        const targetStart = this.toMinutes(startTime);
        const targetEnd = this.toMinutes(endTime);

        let currentStart = dayStartMinutes;
        let lecturePeriodCount = 0;

        for (let p = 0; p < settings.periodsPerDay; p++) {
            lecturePeriodCount++;

            const periodStart = currentStart;
            const periodEnd = currentStart + settings.periodDuration;

            if ((targetStart >= periodStart && targetStart < periodEnd) || (targetEnd >= periodStart && targetEnd < periodEnd)) {
                return p;
            }

            currentStart += settings.periodDuration;

            const breakToInsert = enabledBreaks.find((b) => b.afterPeriod === lecturePeriodCount);
            if (breakToInsert) {
                currentStart += breakToInsert.duration;
            }
        }

        return -1;
    }

    // getInstructorSlots(ids: string[]): Observable<any> {
    //     return this.http.post(`${this.resourceUrl}/instructors/slots`, ids);
    // }

    getInstructorSlots(request: InstructorSlotRequest): Observable<any> {
        return this.http.post<any>(`${this.resourceUrl}/instructors/slots`, request);
    }

    getStudentTimeTable(req): Observable<any> {
        return this.http.post<any>(`${this.resourceUrl}/student`, req);
    }

    getPersonalTimetable(id): Observable<any[]> {
        let request = {
            instructorIds: [id],
            academicYear: this.commonService.currentUser.academicYear,
            departmentId: null,
            scheduleDay: null // optional
        };
        return this.getInstructorSlots(request);
    }

    getPeriodConflicts(payload: any): Observable<any> {
        return this.http.post(`${this.resourceUrl}/get-period-swap-conflicts`, payload);
    }
}
