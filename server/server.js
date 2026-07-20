import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import { ENV } from './config/envConfig.js';
import { connectDB } from './config/dbConfig.js';
import routes from './routes/index.routes.js';
import cookieParser from 'cookie-parser';
import { connectRedis } from './config/redis.js';

const app = express();

// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: ["http://localhost:5173"]
}))
app.use(morgan('dev'));
app.use(helmet());
app.use(cookieParser());



app.get('/', (req, res) => {
    return res.status(200).json({
        success: true,
        message: "Server is healthy"
    });

})

app.use('/api', routes);
    connectDB();
    connectRedis();
app.use((err, req, res, next) => {
    return res.status(500).json({
        success: false,
        message: err.message
    })
})


app.listen(ENV.PORT, () => {

    console.log("Server is running");
})