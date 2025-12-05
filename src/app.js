import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// import all routes
import healthCheckRoutes from './routes/healthCheck.routes.js';
import rfpRoutes from './routes/rfp.routes.js';
import venderRoutes from './routes/vender.route.js';
import parseTestRoute from './routes/email.routes.js'

app.use('/api/v1', healthCheckRoutes);
app.use('/api/v1/rfp', rfpRoutes);
app.use('/api/v1/vender', venderRoutes);
app.use('/api/v1/email', parseTestRoute)

export default app;