import type {AppCache} from 'src/processing/AppCache.js';
import Big from 'big.js';
import axios from 'axios';

export async function convertCurrency(
    amount: string,
    sourceCurrency: string,
    targetCurrency: string,
    cache: AppCache
): Promise<string> {
    const exchangeRate = await fetchExchangeRate(sourceCurrency, targetCurrency, cache);
    return (new Big(amount)).times(new Big(exchangeRate)).toString();
}

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

function fetchCurrencyTable(cache: AppCache): Promise<Record<string, number>> {
    const cacheKey = `currencyTable_${new Date().toISOString().slice(0, 10)}`;
    return cache.remember(cacheKey, async () => {
        const response = await axios.get('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies.json');
        return response.data;
    });
}
