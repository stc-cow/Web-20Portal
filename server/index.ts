import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { handleDemo } from './routes/demo';
import { createClient } from '@supabase/supabase-js';

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Initialize Supabase client
  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
  const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

  // Example API routes
  app.get('/api/ping', (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? 'ping';
    res.json({ message: ping });
  });

  app.get('/api/demo', handleDemo);

  // Supabase proxy routes
  app.post('/api/db/query', async (req, res) => {
    try {
      if (!supabase) {
        return res.status(500).json({ error: 'Supabase not configured' });
      }

      const { table, operation, select, order, filters } = req.body;

      if (!table || !operation) {
        return res.status(400).json({ error: 'Missing table or operation' });
      }

      let query = supabase.from(table);

      switch (operation) {
        case 'select':
          query = query.select(select || '*');
          if (order) {
            const [column, direction] = Array.isArray(order) ? order : [order, 'asc'];
            query = query.order(column, { ascending: direction === 'asc' });
          }
          if (filters) {
            for (const [key, value] of Object.entries(filters)) {
              query = query.eq(key, value);
            }
          }
          break;
        case 'insert':
          query = query.insert(req.body.data);
          break;
        case 'update':
          query = query.update(req.body.data);
          if (filters) {
            for (const [key, value] of Object.entries(filters)) {
              query = query.eq(key, value);
            }
          }
          break;
        case 'delete':
          query = query.delete();
          if (filters) {
            for (const [key, value] of Object.entries(filters)) {
              query = query.eq(key, value);
            }
          }
          break;
        default:
          return res.status(400).json({ error: 'Invalid operation' });
      }

      const { data, error } = await query;

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      res.json({ data, error: null });
    } catch (error) {
      console.error('Database query error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return app;
}
