export declare const DUMMY_HASH = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
export declare function hashPassword(password: string): string;
export declare function verifyPassword(password: string, passwordHash: string): boolean;
