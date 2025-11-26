import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { CreateUserSchema, LoginSchema } from '@paypay-money-diary/shared'
import { signupHandler } from '@/interface/http/auth/signup'
import { loginHandler } from '@/interface/http/auth/login'
import { meHandler } from '@/interface/http/auth/me'
import { refreshHandler } from '@/interface/http/auth/refresh'
import { logoutHandler } from '@/interface/http/auth/logout'
import { authMiddleware } from '@/interface/http/middleware/auth'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

const api = app.basePath('/api')

api.post('/auth/signup', zValidator('json', CreateUserSchema), signupHandler)
api.post('/auth/login', zValidator('json', LoginSchema), loginHandler)
api.post('/auth/refresh', refreshHandler)
api.post('/auth/logout', authMiddleware, logoutHandler)
api.get('/auth/me', authMiddleware, meHandler)

const port = process.env.PORT || 8080;

export default {
  port,
  fetch: app.fetch,
  tls: {
    cert: Bun.file('../../.certificate/localhost-cert.pem'),
    key: Bun.file('../../.certificate/localhost-key.pem'),
  },
}
