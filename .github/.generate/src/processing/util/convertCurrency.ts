import type {AppCache} from 'src/processing/AppCache.js';
import Big from 'big.js';
import axios from 'axios';

/**
 * Converts an amount from sourceCurrency to targetCurrency using the latest exchange rate.
 * @param amount The amount to convert, as a string like "100.00"
 * @param sourceCurrency The source currency code (e.g., 'usd')
 * @param targetCurrency The target currency code (e.g., 'eur')
 * @param cache
 * @see https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies.json for currency list
 */
export async function convertCurrency(
    amount: string,
    sourceCurrency: string,
    targetCurrency: string,
    cache: AppCache
): Promise<string> {
    const exchangeRate = await fetchExchangeRate(sourceCurrency, targetCurrency, cache);
    return (new Big(amount)).times(new Big(exchangeRate)).round(2).toString();
}

/**
 * Fetches the exchange rate between two currencies, with caching.
 * The cache key is based on the current date to ensure daily updates.
 * @see https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies.json for currency list
 * @param sourceCurrency The source currency code (e.g., 'usd')
 * @param targetCurrency The target currency code (e.g., 'eur')
 * @param cache
 */
function fetchExchangeRate(sourceCurrency: string, targetCurrency: string, cache: AppCache): Promise<string> {
    targetCurrency = targetCurrency.toLowerCase();
    sourceCurrency = sourceCurrency.toLowerCase();

    const cacheKey = `conversionRate_${sourceCurrency}_${targetCurrency}_${new Date().toISOString().slice(0, 10)}`;

    return cache.remember(cacheKey, async () => {
        const currencyTable = await fetchCurrencyTable(cache);

        if (!currencyTable[sourceCurrency]) {
            throw new Error(`Unknown source currency: ${sourceCurrency}`);
        }
        if (!currencyTable[targetCurrency]) {
            throw new Error(`Unknown target currency: ${targetCurrency}`);
        }

        const exchangeRateTable = await axios.get(`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${sourceCurrency}.json`);
        const exchangeRate = exchangeRateTable.data[sourceCurrency][targetCurrency];

        if (!exchangeRate) {
            throw new Error(`Unable to get exchange rate from ${sourceCurrency} to ${targetCurrency}`);
        }

        return (new Big(exchangeRate)).toString();
    });
}

/**
 * Fetches the currency table from the external API, with caching.
 * The cache key is based on the current date to ensure daily updates.
 * @param cache
 */
function fetchCurrencyTable(cache: AppCache): Promise<Record<string, number>> {
    const cacheKey = `currencyTable_${new Date().toISOString().slice(0, 10)}`;
    return cache.remember(cacheKey, async () => {
        const response = await axios.get('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies.json');
        return response.data;
    });
}
