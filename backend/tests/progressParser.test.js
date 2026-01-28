const { parseProgress, isComplete, parseDownloadSpeed, parseETA } = require('../utils/progressParser');

describe('Progress Parser', () => {
    describe('parseProgress', () => {
        test('should parse progress from yt-dlp output', () => {
            expect(parseProgress('[download] 45.2% of 5.2MiB at 2.1MiB/s ETA 00:12')).toBe(45.2);
            expect(parseProgress('[download] 100% of 10.5MiB')).toBe(100);
            expect(parseProgress('[download] 0%')).toBe(0);
        });

        test('should return null for non-progress lines', () => {
            expect(parseProgress('[info] Some info message')).toBeNull();
            expect(parseProgress('')).toBeNull();
            expect(parseProgress(null)).toBeNull();
        });
    });

    describe('isComplete', () => {
        test('should detect completion', () => {
            expect(isComplete('[download] 100%')).toBe(true);
            expect(isComplete('[ExtractAudio] Destination: file.mp3')).toBe(true);
            expect(isComplete('[Merger] Merging formats')).toBe(true);
        });

        test('should return false for incomplete', () => {
            expect(isComplete('[download] 50%')).toBe(false);
            expect(isComplete('[info] Processing')).toBe(false);
        });
    });

    describe('parseDownloadSpeed', () => {
        test('should parse download speed', () => {
            expect(parseDownloadSpeed('at 2.1MiB/s')).toBe('2.1MiB/s');
            expect(parseDownloadSpeed('at 500KiB/s')).toBe('500KiB/s');
        });
    });

    describe('parseETA', () => {
        test('should parse ETA', () => {
            expect(parseETA('ETA 00:12')).toBe('00:12');
            expect(parseETA('ETA 01:30')).toBe('01:30');
        });
    });
});
