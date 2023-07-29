import { test, expect, makeOnboardingRestore, FUJI_APP_LOCAL_URL, switchToTestnetNetwork, PASSWORD } from './utils';

test('has title', async ({ page }) => {
  await page.goto(FUJI_APP_LOCAL_URL);

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/App - Fuji Money/);
});

test('should connect to the extension and mint fujis', async ({ page, extensionId, context }) => {
  await makeOnboardingRestore(page, extensionId);
  await switchToTestnetNetwork(page, extensionId);
  await page.goto(FUJI_APP_LOCAL_URL);
  await page.waitForSelector('text=Mint')

  // connect Marina
  await page.getByRole('button', { name: 'Connect Wallet' }).click();
  // click on first article (Marina)
  await page.getByRole('article').first().click();
  const marinaPopup = await context.waitForEvent('page');
  await marinaPopup.getByRole('button', { name: 'Connect' }).click()
  
  const marinaPopupCreateAccount = await context.waitForEvent('page');
  await marinaPopupCreateAccount.getByRole('button', { name: 'Accept' }).click()
  // fill password
  await marinaPopupCreateAccount.getByPlaceholder('Password').fill(PASSWORD);
  await marinaPopupCreateAccount.getByRole('button', { name: 'Unlock' }).click()

  await page.waitForSelector('text=Mint')

  // go to mint
  await page.getByRole('button', { name: 'Mint' }).click();
  // expect to be on mint page
  await page.waitForSelector('FUSD');
  expect(page.url()).toBe(`${FUJI_APP_LOCAL_URL}/borrow/FUSD`);

  await page.getByRole('button', { name: 'Mint' }).click();
  await page.getByPlaceholder('0.00').fill('25');
  await page.getByRole('button', { name: 'Proceed to deposit' }).click();
});
