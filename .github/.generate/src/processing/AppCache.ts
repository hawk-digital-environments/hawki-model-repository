import * as fs from 'node:fs';
import {hash} from 'node:crypto';

export interface AppCache {
    remember<T>(key: string, value: () => Promise<T>): Promise<T>;
}

export function createCache(storageFileName: string): AppCache {
    if (!fs.existsSync(storageFileName)) {
        fs.writeFileSync(storageFileName, JSON.stringify({}), 'utf-8');
    }

    const storage: Record<string, any> = JSON.parse(fs.readFileSync(storageFileName, 'utf-8'));

    return {
        async remember(key: string, value: () => Promise<any>): Promise<any> {
            if (key.length > 50) {
                key = 'hash.' + hash('sha256', key);
            }
            if (storage[key] || storage[key] === null) {
                return storage[key];
            }
            const result = await value();
            storage[key] = result;
            fs.writeFileSync(storageFileName, JSON.stringify(storage, null, 4), 'utf-8');
            return result;
        }
    };
}
