const SANTIAGO_TIME_ZONE = 'America/Santiago';

function getDatePartsInSantiago(at: Date): { year: number; month: number; day: number } {
    const fmt = new Intl.DateTimeFormat('en-US', {
        timeZone: SANTIAGO_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
    const parts = Object.fromEntries(fmt.formatToParts(at).map((p) => [p.type, p.value]));

    return {
        year: Number(parts.year),
        month: Number(parts.month),
        day: Number(parts.day),
    };
}

export function getSantiagoDateKey(at: Date): string {
    const { year, month, day } = getDatePartsInSantiago(at);
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getSantiagoOffsetMs(at: Date): number {
    const fmt = new Intl.DateTimeFormat('en-US', {
        timeZone: SANTIAGO_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });

    const parts = Object.fromEntries(fmt.formatToParts(at).map((p) => [p.type, p.value]));
    const localAsUtc = Date.UTC(
        Number(parts.year),
        Number(parts.month) - 1,
        Number(parts.day),
        Number(parts.hour),
        Number(parts.minute),
        Number(parts.second),
    );

    return at.getTime() - localAsUtc;
}

export function parseSantiagoDate(dateStr: string, endOfDay = false): Date {
    const [y, m, d] = dateStr.split('-').map(Number);
    const noonRef = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    const offsetMs = getSantiagoOffsetMs(noonRef);
    const baseMs = endOfDay
        ? Date.UTC(y, m - 1, d, 23, 59, 59, 999)
        : Date.UTC(y, m - 1, d, 0, 0, 0, 0);

    return new Date(baseMs + offsetMs);
}

// Accepts date-only (YYYY-MM-DD) or ISO datetime inputs and maps them to
// a Chile calendar date boundary, avoiding UTC-based day shifts.
export function parseDateInputAsSantiagoDate(dateInput: string, endOfDay = false): Date {
    const dateKeyMatch = /^\d{4}-\d{2}-\d{2}/.exec(dateInput);
    if (dateKeyMatch) {
        return parseSantiagoDate(dateKeyMatch[0], endOfDay);
    }

    const parsed = new Date(dateInput);
    if (Number.isNaN(parsed.getTime())) {
        return new Date(NaN);
    }

    return parseSantiagoDate(getSantiagoDateKey(parsed), endOfDay);
}

export function parseUtcDateOnly(dateStr: string, endOfDay = false): Date {
    const [y, m, d] = dateStr.split('-').map(Number);
    return endOfDay
        ? new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999))
        : new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}

// Inclusive range compatible with mixed storage strategies for date-only values:
// historical UTC midnight and newer Chile midnight.
export function buildDateOnlyCompatWhere(startDateStr?: string | null, endDateStr?: string | null) {
    const where: { gte?: Date; lte?: Date } = {};

    if (startDateStr) {
        const utcStart = parseUtcDateOnly(startDateStr);
        const chileStart = parseSantiagoDate(startDateStr);
        where.gte = utcStart.getTime() <= chileStart.getTime() ? utcStart : chileStart;
    }

    if (endDateStr) {
        const utcEnd = parseUtcDateOnly(endDateStr, true);
        const chileEnd = parseSantiagoDate(endDateStr, true);
        where.lte = utcEnd.getTime() >= chileEnd.getTime() ? utcEnd : chileEnd;
    }

    return where;
}

export function getSantiagoTodayStart(now: Date = new Date()): Date {
    return parseSantiagoDate(getSantiagoDateKey(now));
}
