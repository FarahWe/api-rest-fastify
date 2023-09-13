import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { z } from 'zod'
import crypto from 'node:crypto'
import { checkSessionIdExists } from '../middlewares/check-session-id-exits'

export async function transactionsRoutes(app: FastifyInstance) {
  app.get(
    '/',
    {
      preHandler: [checkSessionIdExists]
    },
    async request => {
      const { sessionId } = request.cookies

      const transactions = await knex('transactions')
        .where('session_id', sessionId)
        .select()

      return { transactions }
    }
  )

  app.get(
    '/:id',
    {
      preHandler: [checkSessionIdExists]
    },
    async (request, reply) => {
      const { sessionId } = request.cookies

      const getTransactionParamsSchema = z.object({
        id: z.string().uuid()
      })

      const { id } = getTransactionParamsSchema.parse(request.params)

      const transaction = await knex('transactions')
        .where({ id, session_id: sessionId })
        .first()

      return { transaction }
    }
  )

  app.get(
    '/summary',
    {
      preHandler: [checkSessionIdExists]
    },
    async request => {
      const { sessionId } = request.cookies

      const summary = await knex('transactions')
        .where('session_id', sessionId)
        .sum('amount', { as: 'amount' })
        .first()

      return { summary }
    }
  )

  app.post('/', async (request, reply) => {
    const createTransactionBodyShema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(['credit', 'debit'])
    })

    const { title, type, amount } = createTransactionBodyShema.parse(
      request.body
    )

    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = crypto.randomUUID()

      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
      })
    }

    await knex('transactions').insert({
      id: crypto.randomUUID(),
      title,
      amount: type === 'credit' ? amount : amount * -1,
      session_id: sessionId
    })

    return reply.code(201).send()
  })
}
