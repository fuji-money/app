import {
  test,
  expect,
  makeOnboardingRestore,
  switchToTestnetNetwork,
  PASSWORD,
} from './utils'

import { DEFAULT_LIGHTNING_LIMITS } from '../lib/swaps'

// this test does not go through the entire mint flow (waiting for a regtest config to do this)
// it only checks that the mint page is accessible
test('connect marina & use the mint and multiply page', async ({
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

  let button = page.getByRole('button', { name: 'Proceed to Deposit' })
  let amount = page.getByPlaceholder('0.00')
  let slider = page.getByRole('slider')
  let oracle = page.getByText('Fuji.Money', { exact: true })

  // test lightning out of bounds (> maximal)
  await amount.fill((DEFAULT_LIGHTNING_LIMITS.maximal + 1).toString())
  await expect(button).toBeDisabled()
  await expect(page.getByText(/out of bounds/i)).toBeVisible()
  await expect(page.getByText(/not enough funds/i)).toBeVisible()

  // test lightning out of bounds (< minimal)
  await amount.fill((DEFAULT_LIGHTNING_LIMITS.minimal - 1).toString())
  await expect(button).toBeDisabled()
  await expect(page.getByText(/out of bounds/)).toBeVisible()

  // expect to find warning about unsafe ratio
  await slider.fill('121')
  await expect(page.getByText('ratio is unsafe')).toBeVisible()

  // expect warning about not enough oracles
  await oracle.click()
  await expect(page.getByText('not enough oracles')).toBeVisible()

  // go to multiply page
  await page.getByRole('link', { name: 'Multiply' }).click()
  await page.waitForSelector('text=BTC-LONG')
  await page.getByRole('button', { name: 'Multiply' }).click()
  await page.waitForSelector('text=Deposit your L-BTC', { state: 'visible' })

  button = page.getByRole('button', { name: 'Multiply' })
  amount = page.getByPlaceholder('0.00')
  slider = page.getByRole('slider')
  oracle = page.getByText('Fuji.Money', { exact: true })

  // test lightning out of bounds (> maximal)
  await amount.fill((DEFAULT_LIGHTNING_LIMITS.maximal + 1).toString())
  await expect(button).toBeDisabled()
  await expect(page.getByText(/out of bounds/i)).toBeVisible()
  await expect(page.getByText(/not enough funds/i)).toBeVisible()

  // test lightning out of bounds (< minimal)
  await amount.fill((DEFAULT_LIGHTNING_LIMITS.minimal - 1).toString())
  await expect(button).toBeDisabled()
  await expect(page.getByText(/out of bounds/)).toBeVisible()

  // expect to find warning about unsafe ratio
  await slider.fill('99') // a dangerous level for the ratio
  await slider.dispatchEvent('mouseup') // slider updates ratio on mouse up
  await expect(page.getByText('ratio is unsafe')).toBeVisible()

  // expect warning about not enough oracles
  await oracle.click()
  await expect(page.getByText('not enough oracles')).toBeVisible()
})
