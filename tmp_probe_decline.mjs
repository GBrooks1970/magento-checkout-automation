// THROWAWAY probe (backlog #2): inspect the real checkout payment-step DOM for
// the declinepayment method, and the decline-message DOM after placing the order.
// Delete after use. Run: node tmp_probe_decline.mjs
import { chromium } from 'playwright';

const BASE = 'http://localhost:8080';
const log = (...a) => console.log(...a);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
page.setDefaultTimeout(30000);

try {
  // Add a product to the cart
  await page.goto(`${BASE}/push-it-messenger-bag.html`, { waitUntil: 'domcontentloaded' });
  await page.click('#product-addtocart-button');
  await page.waitForSelector('div.message-success', { timeout: 20000 }).catch(() => log('(no add success msg)'));

  // Go to checkout, fill shipping
  await page.goto(`${BASE}/checkout`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#customer-email', { timeout: 30000 });
  await page.fill('#customer-email', 'test.guest@example.com');
  await page.fill('input[name="firstname"]', 'Test');
  await page.fill('input[name="lastname"]', 'Guest');
  await page.fill('input[name="street[0]"]', '6146 Honey Bluff Parkway');
  await page.fill('input[name="city"]', 'Calder');
  await page.selectOption('select[name="country_id"]', { label: 'United States' });
  await page.waitForSelector('select[name="region_id"]', { timeout: 15000 });
  await page.selectOption('select[name="region_id"]', { label: 'Michigan' });
  await page.fill('input[name="postcode"]', '49628-7978');
  await page.fill('input[name="telephone"]', '555-229-3326');
  await page.click('button.action.continue.primary');

  // Shipping method
  await page.waitForSelector('input[value="flatrate_flatrate"]', { timeout: 20000 });
  await page.check('input[value="flatrate_flatrate"]');
  await page.click('.action.primary[data-role="opc-continue"]');

  // Payment step — dump the whole payment area
  await page.waitForSelector('.checkout-payment-method', { timeout: 20000 });
  await page.waitForTimeout(3000); // let KO render the method list
  const paymentHtml = await page.$eval('.checkout-payment-method', el => el.innerHTML).catch(() => '(no .checkout-payment-method)');
  log('\n========== PAYMENT AREA HTML ==========\n');
  log(paymentHtml.slice(0, 6000));

  log('\n========== PAYMENT METHOD RADIOS / LABELS ==========\n');
  const methods = await page.$$eval('.payment-method input[type="radio"], .payment-method label', els =>
    els.map(e => ({ tag: e.tagName, id: e.id || null, for: e.getAttribute('for') || null, value: e.getAttribute('value') || null, text: (e.textContent || '').trim().slice(0, 40) })));
  log(JSON.stringify(methods, null, 2));

  // Try to select declinepayment + place order, then dump any error
  const declineLabel = await page.$('label[for="declinepayment"]');
  if (declineLabel) {
    log('\n>>> label[for="declinepayment"] FOUND — selecting and placing order');
    await declineLabel.click();
    await page.waitForTimeout(1000);
    const placeBtn = await page.$('.payment-method._active .payment-method-content button.action.primary.checkout, .payment-method-content button.action.primary.checkout');
    if (placeBtn) { await placeBtn.click(); } else { log('(place order button not found)'); }
    await page.waitForTimeout(6000);
    log('\n========== ERROR MESSAGE CANDIDATES ==========\n');
    const errs = await page.$$eval('.message-error, .message.error, [role="alert"], .messages .message', els =>
      els.map(e => ({ cls: e.className, text: (e.textContent || '').trim().slice(0, 120) })));
    log(JSON.stringify(errs, null, 2));
  } else {
    log('\n>>> label[for="declinepayment"] NOT FOUND — method not rendered in OPC');
  }
} catch (e) {
  log('PROBE ERROR:', e.message);
} finally {
  await browser.close();
}
