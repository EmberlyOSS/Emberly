import bcrypt from 'bcryptjs';

export async function hashPassword(password: string) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hashed: string) {
    return bcrypt.compare(password, hashed);
}
