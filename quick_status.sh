#!/bin/bash
# Quick status check
echo "Checking Supabase status..."
curl -s http://localhost:54321/health 2>&1 | head -3 || echo "API not responding"
echo "---"
ps aux | grep -E '[s]upabase|docker' | head -5 || echo "No supabase processes"
echo "---"
docker ps | grep -E 'supabase|db' || echo "No supabase containers running"