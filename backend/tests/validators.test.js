const { isValidYouTubeUrl, sanitizeFilename, isValidFileSize } = require('../utils/validators');

describe('Validators', () => {
    describe('isValidYouTubeUrl', () => {
        test('should validate standard YouTube URLs', () => {
            expect(isValidYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
            expect(isValidYouTubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
            expect(isValidYouTubeUrl('http://youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
        });

        test('should reject invalid URLs', () => {
            expect(isValidYouTubeUrl('not-a-url')).toBe(false);
            expect(isValidYouTubeUrl('https://example.com')).toBe(false);
            expect(isValidYouTubeUrl('')).toBe(false);
            expect(isValidYouTubeUrl(null)).toBe(false);
        });
    });

    describe('sanitizeFilename', () => {
        test('should sanitize filenames', () => {
            expect(sanitizeFilename('test/file<name>')).toBe('test_file_name');
            expect(sanitizeFilename('  test  ')).toBe('test');
            expect(sanitizeFilename('test___name')).toBe('test_name');
        });

        test('should handle empty/null inputs', () => {
            expect(sanitizeFilename('')).toBe('download');
            expect(sanitizeFilename(null)).toBe('download');
        });
    });

    describe('isValidFileSize', () => {
        test('should validate file sizes', () => {
            expect(isValidFileSize(1024, 2048)).toBe(true);
            expect(isValidFileSize(2048, 2048)).toBe(true);
            expect(isValidFileSize(2049, 2048)).toBe(false);
            expect(isValidFileSize(0, 2048)).toBe(false);
        });
    });
});
