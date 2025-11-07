import express from 'express';
import swaggerUi from 'swagger-ui-express';
import authRoutes from './routes/auth.routes';
import issueRoutes from './routes/issue.routes';
import userRoutes from './routes/user.routes';
import uploadRoutes from './routes/upload.routes';
import paymentRoutes from './routes/payment.routes';
import reviewRoutes from './routes/review.routes';
import completionRoutes from './routes/completion.routes';
import { swaggerSpec } from './config/swagger.config';
import { initializeSubscriptions } from './subscribers';

const app = express();

// Middleware
app.use(express.json());

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/auth', authRoutes);
app.use('/issues', issueRoutes);
app.use('/users', userRoutes);
app.use('/upload', uploadRoutes);
app.use('/payments', paymentRoutes);
app.use('/reviews', reviewRoutes);
app.use('/', completionRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize PubSub subscriptions
// initializeSubscriptions().catch((error) => {
//   console.error('Failed to initialize PubSub subscriptions:', error);
// });

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
