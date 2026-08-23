import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../src/utils/crypto';

describe('password hashing', () => {
	it('hashes and verifies a password', async () => {
		const password = 'ChangeThisPassword123!';

		const hash = await hashPassword(password);

		expect(hash).toMatch(/^pbkdf2\$sha256\$100000\$/);

		await expect(verifyPassword(password, hash)).resolves.toBe(true);

		await expect(verifyPassword('WrongPassword123!', hash)).resolves.toBe(false);
	});

	it('generates the admin password hash', async () => {
		const password = 'Admin@12345!';
		const hash = await hashPassword(password);

		console.log('\nADMIN HASH:');
		console.log(hash);

		await expect(verifyPassword(password, hash)).resolves.toBe(true);
	});

	it('generates the employee test password hash', async () => {
		const password = 'Employee@12345!';
		const hash = await hashPassword(password);

		console.log('\nEMPLOYEE HASH:');
		console.log(hash);

		await expect(verifyPassword(password, hash)).resolves.toBe(true);
	});
});
