import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { CreateUserSchema, LoginSchema } from '@paypay-money-diary/shared'
import { signupHandler } from '@/interface/http/auth/signup'
import { loginHandler } from '@/interface/http/auth/login'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

const api = app.basePath('/api')

api.post('/auth/signup', zValidator('json', CreateUserSchema), signupHandler)
api.post('/auth/login', zValidator('json', LoginSchema), loginHandler)

const port = process.env.PORT || 8080;

export default {
  port,
  fetch: app.fetch,
  tls: {
    cert: Bun.file('../../.certificate/localhost-cert.pem'),
    key: Bun.file('../../.certificate/localhost-key.pem'),
  },
}
