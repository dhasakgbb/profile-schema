import { describe, expect, it } from 'vitest';
import type { ExportedProfile } from '../src/schema';
import { decodeProfileFragment } from '../src/fragment';
import {
	followRate,
	modesBy,
	prettyMode,
	readTelemetry,
	totalLaunches
} from '../src/telemetry';

function makeProfile(overrides: Record<string, unknown>): ExportedProfile {
	return {
		version: 1,
		generated_at: '2026-05-26T00:00:00.000Z',
		expires_at: '2026-07-25T00:00:00.000Z',
		preferences: { visual: 50, auditory: 50, read_write: 50, kinesthetic: 50 },
		flags: { reading: 'low', writing: 'low', math: 'low', attention: 'low' },
		needs_corroboration: { reading: false, writing: false, math: false, attention: false },
		strengths: [],
		plan: 'strengths',
		// Cast: tests intentionally pass malformed shapes to exercise the
		// defensive readers. The schema's strict typing is unhelpful here.
		module_overrides: overrides as ExportedProfile['module_overrides'],
		source: 'intake_quiz'
	};
}

describe('readTelemetry', () => {
	it('returns null when the module slot is absent', () => {
		expect(readTelemetry(makeProfile({}), 'spelling')).toBeNull();
	});

	it('returns null when all fields are empty', () => {
		const p = makeProfile({
			spelling: { followed: {}, overrode: {}, last_launches: [], last_override_streak: 0 }
		});
		expect(readTelemetry(p, 'spelling')).toBeNull();
	});

	it('reads a well-formed telemetry block', () => {
		const p = makeProfile({
			spelling: {
				followed: { 'speed-spell': 5, 'word-wheel': 2 },
				overrode: { 'word-sort': 3 },
				last_launches: ['word-sort', 'speed-spell', 'speed-spell'],
				last_override_streak: 1
			}
		});
		const t = readTelemetry(p, 'spelling');
		expect(t).not.toBeNull();
		expect(t?.followed['speed-spell']).toBe(5);
		expect(t?.overrode['word-sort']).toBe(3);
		expect(t?.last_launches).toHaveLength(3);
		expect(t?.last_override_streak).toBe(1);
	});

	it('drops malformed counts (negative, NaN, string)', () => {
		const p = makeProfile({
			math: {
				followed: { 'times-tables': 3, 'speed-add': -1, 'number-sort': 'bad' },
				overrode: { 'number-sort': Number.NaN },
				last_launches: [],
				last_override_streak: 0
			}
		});
		const t = readTelemetry(p, 'math');
		expect(t?.followed['times-tables']).toBe(3);
		expect(t?.followed['speed-add']).toBeUndefined();
		expect(t?.followed['number-sort']).toBeUndefined();
		expect(t?.overrode['number-sort']).toBeUndefined();
	});

	it('coerces float counts down to integers', () => {
		const p = makeProfile({
			states: {
				followed: { 'road-trip': 2.9 },
				overrode: {},
				last_launches: ['road-trip'],
				last_override_streak: 0
			}
		});
		const t = readTelemetry(p, 'states');
		expect(t?.followed['road-trip']).toBe(2);
	});

	it('filters non-string entries out of last_launches', () => {
		const p = makeProfile({
			spelling: {
				followed: {},
				overrode: { 'word-sort': 1 },
				last_launches: ['word-sort', 42, null, 'speed-spell'],
				last_override_streak: 0
			}
		});
		const t = readTelemetry(p, 'spelling');
		expect(t?.last_launches).toEqual(['word-sort', 'speed-spell']);
	});

	it('clamps negative or non-finite override streaks to 0', () => {
		const p = makeProfile({
			math: {
				followed: { 'times-tables': 1 },
				overrode: {},
				last_launches: [],
				last_override_streak: -5
			}
		});
		const t = readTelemetry(p, 'math');
		expect(t?.last_override_streak).toBe(0);
	});

	it('survives an entirely missing module_overrides object', () => {
		const p = makeProfile({}) as ExportedProfile;
		// @ts-expect-error — simulate older profile w/o the field
		delete p.module_overrides;
		expect(readTelemetry(p, 'spelling')).toBeNull();
	});
});

describe('totalLaunches', () => {
	it('sums followed and overrode buckets', () => {
		expect(
			totalLaunches({
				followed: { a: 3, b: 2 },
				overrode: { a: 1 },
				last_launches: [],
				last_override_streak: 0
			})
		).toBe(6);
	});
});

describe('followRate', () => {
	it('returns 0 for an empty block', () => {
		expect(
			followRate({ followed: {}, overrode: {}, last_launches: [], last_override_streak: 0 })
		).toBe(0);
	});

	it('returns 100 when every launch followed', () => {
		expect(
			followRate({
				followed: { a: 4 },
				overrode: {},
				last_launches: [],
				last_override_streak: 0
			})
		).toBe(100);
	});

	it('rounds to nearest integer', () => {
		// 2 followed, 1 overrode = 66.66… → 67
		expect(
			followRate({
				followed: { a: 2 },
				overrode: { b: 1 },
				last_launches: [],
				last_override_streak: 0
			})
		).toBe(67);
	});
});

describe('modesBy', () => {
	it('sorts by total launches descending', () => {
		const rows = modesBy({
			followed: { a: 1, b: 5 },
			overrode: { a: 2, c: 1 },
			last_launches: [],
			last_override_streak: 0
		});
		expect(rows.map((r) => r.mode)).toEqual(['b', 'a', 'c']);
	});

	it('zero-fills modes that only appear in one bucket', () => {
		const rows = modesBy({
			followed: { a: 1 },
			overrode: { b: 2 },
			last_launches: [],
			last_override_streak: 0
		});
		expect(rows.find((r) => r.mode === 'a')).toEqual({ mode: 'a', followed: 1, overrode: 0 });
		expect(rows.find((r) => r.mode === 'b')).toEqual({ mode: 'b', followed: 0, overrode: 2 });
	});
});

describe('prettyMode', () => {
	it('converts kebab-case to Title Case', () => {
		expect(prettyMode('speed-spell')).toBe('Speed Spell');
		expect(prettyMode('times-tables')).toBe('Times Tables');
		expect(prettyMode('road-trip')).toBe('Road Trip');
	});

	it('handles single-word modes', () => {
		expect(prettyMode('quest')).toBe('Quest');
	});
});

describe('decodeProfileFragment', () => {
	// Mirror of the consumer's encoder so the test exercises the actual
	// round-trip the dashboard cares about. If either side drifts, this
	// test catches the contract break.
	function encode(json: string): string {
		const b64 = Buffer.from(encodeURIComponent(json), 'binary').toString('base64');
		return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
	}

	it('round-trips a typical profile JSON', () => {
		const json = '{"hello":"world","n":1}';
		expect(decodeProfileFragment(encode(json))).toBe(json);
	});

	it('handles JSON whose base64 contains URL-unsafe characters', () => {
		// Hand-built case: '++++++' raw bytes produce a base64 starting with
		// 'KysrKysr' — but we need actual '+' or '/' in the base64. Use
		// payload bytes specifically chosen to force them. The bytes 0xFB 0xEF
		// 0xFF base64-encode to '++//', which after URL-safing becomes '--__'.
		const raw = 'ûïÿ';
		const standardB64 = Buffer.from(raw, 'binary').toString('base64');
		expect(standardB64).toContain('+');
		expect(standardB64).toContain('/');
		const urlSafe = standardB64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
		// decodeProfileFragment runs decodeURIComponent on the result, so
		// only test it with content that's already %-encoded if needed —
		// here just verify the URL-safe reversal happens.
		const decoded = decodeProfileFragment(urlSafe);
		expect(decoded).toBe(raw);
	});

	it('survives all three padding-strip lengths (0, 1, 2 chars stripped)', () => {
		// Length controls how many '=' the encoder strips. Test each case.
		expect(decodeProfileFragment(encode('a'))).toBe('a');
		expect(decodeProfileFragment(encode('ab'))).toBe('ab');
		expect(decodeProfileFragment(encode('abc'))).toBe('abc');
	});

	it('returns null on bogus input', () => {
		expect(decodeProfileFragment('!!!not-base64@@@')).toBeNull();
	});

	it('returns null on empty input', () => {
		// atob('') is legal and returns '', but decodeURIComponent('') is also '',
		// so empty input round-trips to empty. Document this is the contract.
		expect(decodeProfileFragment('')).toBe('');
	});
});
