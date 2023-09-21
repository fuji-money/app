import {
  test,
  expect,
  makeOnboardingRestore,
  switchToTestnetNetwork,
  PASSWORD,
} from './utils'

// this test does not go through the entire mint flow (waiting for a regtest config to do this)
// it only checks that the mint page is accessible
test('connect marina & use the mint page', async ({
  page,
  extensionId,
  context,
}) => {
  await makeOnboardingRestore(page, extensionId)
  await switchToTestnetNetwork(page, extensionId)
  await page.goto('/')
  await page.waitForSelector('text=Mint')

  // connect Marina
  await page.getByRole('button', { name: 'Connect Wallet' }).click()
  await page.getByRole('article').first().click() // first is marina
  const marinaPopup = await context.waitForEvent('page')
  await marinaPopup.getByRole('button', { name: 'Connect' }).click()

  const marinaPopupCreateAccount = await context.waitForEvent('page')
  await marinaPopupCreateAccount.getByRole('button', { name: 'Accept' }).click()
  await marinaPopupCreateAccount.getByPlaceholder('Password').fill(PASSWORD)
  await marinaPopupCreateAccount.getByRole('button', { name: 'Unlock' }).click()

  await page.waitForSelector('text=Mint')

  // go to mint and try to fill some random values
  await page.getByRole('button', { name: 'Mint' }).click()
  await page.waitForSelector('text=Collateral Asset')
  await page.getByRole('button', { name: 'Mint' }).click()
  await page.waitForSelector('text=Borrow')
  await page.getByPlaceholder('0.00').fill('25')

  const inputFujiQtty = page.getByPlaceholder('0.00')
  const proceedButton = page.getByRole('button', { name: 'Proceed to Deposit' })
  const marinaNoFunds = page.getByText('not enough funds')
  const lnOutOfBounds = page.getByText('out of bounds')
  const ratioIsUnsafe = page.getByText('ratio is unsafe')
  const contractRatio = page.getByRole('slider')

  // expect to find the proceed to deposit button disabled
  await inputFujiQtty.fill('5')
  await expect(proceedButton).toBeDisabled()
  await expect(marinaNoFunds).toBeVisible()
  await expect(lnOutOfBounds).toBeVisible()

  // expect to find the proceed to deposit button enabled (due to lightning)
  await inputFujiQtty.fill('25')
  await expect(proceedButton).toBeEnabled()
  await expect(marinaNoFunds).toBeVisible()
  await expect(lnOutOfBounds).toBeHidden()

  // expect to see the ratio is unsafe warning
  await contractRatio.fill('110')
  await expect(proceedButton).toBeEnabled()
  await expect(ratioIsUnsafe).toBeVisible()
})
