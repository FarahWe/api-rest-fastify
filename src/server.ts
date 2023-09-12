import fastify from 'fastify'
import { knex } from './database'

const app = fastify()

app.get('/hello', async () => {
  const transactions = await knex('transactions')
    .insert({
      id: crypto.randomUUID(),
      title: 'Transação Urubu do pix',
      amount: 1000
    })
    .returning('*')

  return transactions
})

app
  .listen({
    port: 3333
  })
  .then(() => {
    console.log('HTTP server listening on port 3333')
  })
