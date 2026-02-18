#!/bin/bash

# Deploy Firebase Cloud Functions for Unfold Cards
echo "🚀 Deploying Firebase Cloud Functions..."

# Deploy all notification functions with duplicate prevention
firebase deploy --only functions:sendDailyReminder,sendWeeklyHighlights,sendNewCategoryAlert

echo "✅ Deployment complete!"
echo "📱 Real notifications from your data files with duplicate prevention:"
echo "⏰ Daily: 9:00 AM (once per day)"
echo "📊 Weekly: Monday 10:00 AM (once per week)" 
echo "🆕 New Categories: Real-time when added (once per category)"
echo "� Duplicate prevention: Active for all notification types"
echo "📋 Questions: Rotating through your relationship, friendship, family, emotional, and fun zone data"
