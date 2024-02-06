import express, { Request, Response } from 'express';
import { PERIOD_FIELD, XAPI } from 'xapi-node';

const app = express();
const port = process.env.PORT || 3000;
let healthCheck = true;

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
    healthCheck = false;
});



function isPeriodValid(periodParam: string): boolean {
    return Object.values(PERIOD_FIELD).includes(Number(periodParam));
}


app.get('/api/prices/:symbol/:period', async (req: Request, res: Response) => {
    console.log(`Received request for price history for symbol ${req.params.symbol} and period ${req.params.period}`);
    const symbol = req.params.symbol;
    const periodParam = req.params.period;

    // Validate the symbol parameter
    if (!symbol) {
        return res.status(400).json({ error: 'A "symbol" path parameter is required.' });
    }

    // Validate the period parameter
    if (!isPeriodValid(periodParam)) {
        return res.status(400).send({
            message: `Invalid period.Must be one of ${Object.values(PERIOD_FIELD).join(", ")}.`
        });
    }

    // Now that we know the period is valid, convert it to the corresponding enum value
    const period = Number(periodParam) as PERIOD_FIELD;


    try {
        const { candles, digits } = await xapi.getPriceHistory({
            symbol,
            period,
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
        res.status(500).send({ message: 'Error fetching price history', error });
    }
});

app.get('/health-check', async (req: Request, res: Response) => {
    if (healthCheck) {
        res.status(200).send('OK');
    } else {
        res.status(500).send('Health check failed');
    }
});

app.get('/health-check/setfalse', async (req: Request, res: Response) => {
    healthCheck = false;
    res.status(200).send('OK');
});


app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
