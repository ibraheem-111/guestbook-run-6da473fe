// Guestbook Express Server
require('dotenv').config();

const express = require('express');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// In-memory rate limit store: { ipHash: [timestamp1, timestamp2, ...] }
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 3;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Simple HTML escape for XSS prevention
function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getIpHash(req) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  return crypto.createHash('sha256').update(ip).digest('hex');
}

function checkRateLimit(ipHash) {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ipHash) || [];
  const validTimestamps = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
  if (validTimestamps.length >= RATE_LIMIT_MAX) {
    return false;
  }
  validTimestamps.push(now);
  rateLimitMap.set(ipHash, validTimestamps);
  return true;
}

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// API routes

// GET /api/entries - list all entries sorted newest-first
app.get('/api/entries', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('guestbook_entries')
      .select('id, name, message, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({ entries: data || [] });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/entries - create a new entry
app.post('/api/entries', async (req, res) => {
  try {
    let { name, message, honeypot } = req.body;

    // Honeypot check (anti-spam)
    if (honeypot && honeypot.trim() !== '') {
      return res.status(400).json({ error: 'Validation failed' });
    }

    // Trim inputs
    name = typeof name === 'string' ? name.trim() : '';
    message = typeof message === 'string' ? message.trim() : '';

    // Validation
    const errors = [];
    if (!name || name.length < 1) {
      errors.push('Name is required');
    }
    if (name.length > 100) {
      errors.push('Name exceeds 100 characters');
    }
    if (!message || message.length < 1) {
      errors.push('Message is required');
    }
    if (message.length > 500) {
      errors.push('Message exceeds 500 characters');
    }
    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    // XSS prevention: escape HTML before storing
    const safeName = escapeHtml(name);
    const safeMessage = escapeHtml(message);

    // Rate limiting
    const ipHash = getIpHash(req);
    if (!checkRateLimit(ipHash)) {
      return res.status(429).json({ error: 'Rate limit exceeded. Try again later.' });
    }

    const { data, error } = await supabase
      .from('guestbook_entries')
      .insert([{ name: safeName, message: safeMessage, ip_hash: ipHash }])
      .select('id, name, message, created_at')
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    res.status(201).json(data);
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// SPA catch-all
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Guestbook server listening on port ${PORT}`);
});
