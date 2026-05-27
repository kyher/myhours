import { execSync } from 'node:child_process'

execSync('pnpm exec prisma migrate deploy', { stdio: 'pipe' })
