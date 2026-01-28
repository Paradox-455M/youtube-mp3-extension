const { Cache } = require('../utils/cache');

describe('Cache', () => {
    let cache;

    beforeEach(() => {
        cache = new Cache(1000); // 1 second TTL for testing
    });

    test('should store and retrieve values', () => {
        cache.set('key1', 'value1');
        expect(cache.get('key1')).toBe('value1');
    });

    test('should return null for non-existent keys', () => {
        expect(cache.get('nonexistent')).toBeNull();
    });

    test('should expire entries after TTL', (done) => {
        cache.set('key1', 'value1');
        expect(cache.get('key1')).toBe('value1');
        
        setTimeout(() => {
            expect(cache.get('key1')).toBeNull();
            done();
        }, 1100);
    });

    test('should delete entries', () => {
        cache.set('key1', 'value1');
        cache.delete('key1');
        expect(cache.get('key1')).toBeNull();
    });

    test('should clear all entries', () => {
        cache.set('key1', 'value1');
        cache.set('key2', 'value2');
        cache.clear();
        expect(cache.size()).toBe(0);
    });

    test('should clean expired entries', (done) => {
        cache.set('key1', 'value1');
        cache.set('key2', 'value2', 2000); // 2 second TTL
        
        setTimeout(() => {
            cache.cleanExpired();
            expect(cache.get('key1')).toBeNull();
            expect(cache.get('key2')).toBe('value2');
            done();
        }, 1100);
    });
});
