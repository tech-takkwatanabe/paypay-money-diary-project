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

export default {
  port: process.env.PORT || 8080,
  fetch: app.fetch,
}
