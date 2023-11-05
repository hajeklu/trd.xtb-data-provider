import express, { Request, Response } from 'express';
import { PERIOD_FIELD, XAPI } from 'xapi-node';

const app = express();
const port = 3000;
export const symbolsToAnalysts = ['EURGBP', 'USDCAD', 'AUDUSD', 'EURUSD', 'USDJPY', 'GBPUSD', 'EURJPY',
    'EURCHF', 'GBPJPY', 'GBPCHF', 'USDCHF', 'NZDUSD', 'CADJPY', 'GBPCAD',
    'NZDCAD', 'AUDJPY', 'EURNOK', 'AUDCAD', 'EURNZD', 'EURCNH', 'NZDCHF',
    'GBPNZD', 'EURCAD', 'AUDCHF', 'AUDNZD', 'EURAUD', 'GBPAUD', 'USDNOK',
    'USDCNH', 'USDSEK', 'CHFJPY', 'EURSEK', 'CADCHF', 'DE30', 'US100', 'EU50', 'UK100']

// Set up your XAPI configuration with your actual account details
const xapi = new XAPI({
    accountId: process.env.TRD_LOGIN!,
    password: process.env.TRD_PASSWORD!,
    type: 'demo', // or 'real'
    host: 'ws.xtb.com', // or any other host if required
});
// Connect to XAPI service
function connectToXAPI() {
    xapi.connect().then(() => {
        console.log('Connected to XAPI');

        // Handle server close events and disconnect XAPI
        process.on('SIGINT', () => {
            xapi.disconnect().then(() => {
                console.log('Disconnected from XAPI');
                process.exit();
            });
        });
    }).catch((error) => {
        console.error('Connection to XAPI failed:', error);

        // Wait for 10 seconds before trying to reconnect
        setTimeout(connectToXAPI, 10000);
    });
}

connectToXAPI()
xapi.onClose(() => {
    console.log('XAPI connection closed, attempting to reconnect...');
    connectToXAPI();
});


app.get('/api/prices/historical', async (req: Request, res: Response) => {
    const symbol = req.query.symbol as string;

    // Validate the symbol parameter
    if (!symbol) {
        return res.status(400).json({ error: 'A "symbol" query parameter is required.' });
    }

    // Check if the symbol is one of the allowed values
    if (!symbolsToAnalysts.includes(symbol)) {
        return res.status(400).json({ error: 'Invalid symbol. The symbol must be one of the allowed symbols.' });
    }

    try {
        const { candles, digits } = await xapi.getPriceHistory({
            symbol: symbol,
            period: PERIOD_FIELD.PERIOD_M1,
        });

        const transformedCandles = candles.map(candle => ({
            open: candle.open / Math.pow(10, digits),
            high: candle.high / Math.pow(10, digits),
            low: candle.low / Math.pow(10, digits),
            close: candle.close / Math.pow(10, digits),
            timestamp: candle.timestamp,
            volume: candle.volume,
        }));

        res.json(transformedCandles);
    } catch (error) {
        console.error('Error fetching price history:', error);
        res.status(500).send('Error fetching price history');
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
