import { Pool } from 'pg';


declare var process : {
  env: {
    DATABASE_URL: string
  }
}


export default new Pool ({
    max: 20,
    connectionString: process.env.DATABASE_URL,
    idleTimeoutMillis: 30000
});

