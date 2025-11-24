import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { CreateUserSchema } from '@paypay-money-diary/shared'
import { signupHandler } from '@/interface/http/auth/signup'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

const api = app.basePath('/api')

api.post('/auth/signup', zValidator('json', CreateUserSchema), signupHandler)

const port = process.env.PORT || 8080;

export default {
  port,
  fetch: app.fetch,
  tls: {
    cert: Bun.file('../../.certificate/localhost-cert.pem'),
    key: Bun.file('../../.certificate/localhost-key.pem'),
  },
}
