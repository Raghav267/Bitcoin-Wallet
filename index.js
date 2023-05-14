const express = require('express');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/get-balances', async (req, res) => {
  try {
    const addresses = [
      '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      '17VZNX1SN5NtKa8UQFxwQbFeFc3iqRYhem',
      // Add more addresses here
    ];

    const btcToUsdAPI = 'https://api.coindesk.com/v1/bpi/currentprice/BTC.json';

    // Fetch the amount of bitcoins stored in each address
    const addressBalances = await Promise.all(
      addresses.map(async (address) => {
        const addressAPI = `https://blockchain.info/rawaddr/${address}`;
        const balanceResponse = await axios.get(addressAPI);
        const balance = balanceResponse.data.final_balance / 1e8; // Convert satoshis to BTC
        return { address, balance };
      })
    );

    // Fetch the BTC to USD conversion rate
    const conversionResponse = await axios.get(btcToUsdAPI);
    const btcToUsdRate = conversionResponse.data.bpi.USD.rate_float;

    // Convert the BTC balances to USD and calculate the total value
    let totalValue = 0;
    const balancesInUsd = addressBalances.map(({ address, balance }) => {
      const valueInUsd = balance * btcToUsdRate;
      totalValue += valueInUsd;
      return {
        address,
        balanceBTC: balance,
        balanceUSD: valueInUsd,
      };
    });

    // Print the results to the terminal
    console.log('Balances for each address:');
    console.table(balancesInUsd);
    console.log(`Total value in USD: ${totalValue.toFixed(2)}`);

    res.status(200).json({
      addresses: balancesInUsd,
      totalValueUSD: totalValue,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching balances' });
  }
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
