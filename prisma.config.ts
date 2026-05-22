import { defineConfig } from 'prisma/config'
import { config } from 'dotenv'

if (process.env.NODE_ENV) {
  config({ path: `.env.${process.env.NODE_ENV}` })
}
config({ path: ['.env.local', '.env'] })

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL!,
  },
})
