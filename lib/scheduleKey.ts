import { ClassSession } from './schedule';

const DELIMITER = '::';

function normalize(value: string): string {
    return value.trim().replace(/\s+/g, ' ');
}

export function buildScheduleKey(s: Pick<ClassSession, 'course' | 'subject' | 'classGroup'>): string {
    return [normalize(s.course), normalize(s.subject), normalize(s.classGroup)].join(DELIMITER);
}
