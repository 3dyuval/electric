import { createClient } from 'redis'
import { ShapeStream } from './client'
import { Message } from './types'

// Create a Redis client
const REDIS_HOST = `localhost`
const REDIS_PORT = 6379
const client = createClient({
  url: `redis://${REDIS_HOST}:${REDIS_PORT}`,
})

client.connect().then(() => {
  console.log(`Connected to Redis server`)

  const issueStream = new ShapeStream({
    shape: { table: `todos` },
    baseUrl: `http://localhost:3000`,
    subscribe: true,
  })
  issueStream.subscribe(async (messages: Message[]) => {
    console.log(`messages`, messages)
    // Begin a Redis transaction
    const pipeline = client.multi()

    // Loop through each message and make writes to the Redis hash for action messages
    messages.forEach((message) => {
      // Upsert/delete
      switch (message.headers?.[`action`]) {
        case `delete`:
          pipeline.hDel(`issues`, message.key!)
          break

        case `insert`:
        case `update`:
          pipeline.hSet(
            `issues`,
            String(message.key),
            JSON.stringify(message.value)
          )
          break
      }
    })

    // Execute all commands as a single transaction
    try {
      await pipeline.exec()
      console.log(`Hash updated successfully`)
    } catch (error) {
      console.error(`Error while updating hash:`, error)
    }
  })
})
