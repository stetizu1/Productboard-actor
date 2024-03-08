import { Page } from 'playwright';

export const login = async (page: Page, { userEmail, userPassword }: { userEmail: string; userPassword: string}) => {
    await page.click('input#email');
    await page.keyboard.type(userEmail);
    await page.click('input#password');
    await page.keyboard.type(userPassword);
    await page.click('button[type="submit"]');
};
