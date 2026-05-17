import rateLimit from 'express-rate-limit';

export const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limite de 100 requisições por IP na janela
  message: { error: 'Muitas requisições originadas deste IP, por favor tente novamente após 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    xForwardedForHeader: false,
  }
});
