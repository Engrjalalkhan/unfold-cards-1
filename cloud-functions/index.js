const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

// Load real questions from your data files
const relationshipQuestions = require('../src/data/questions.relationship.json');
const friendshipQuestions = require('../src/data/questions.friendship.json');
const familyQuestions = require('../src/data/questions.family.json');
const emotionalQuestions = require('../src/data/questions.emotional.json');
const funQuestions = require('../src/data/questions.fun.json');

// Helper function to get all questions from all categories
const getAllQuestionsFromData = () => {
  const allQuestions = [];
  
  // Extract questions from relationship zone
  if (relationshipQuestions.categories && relationshipQuestions.categories[0]) {
    const relZone = relationshipQuestions.categories[0];
    if (relZone.subcategories) {
      relZone.subcategories.forEach(sub => {
        if (sub.questions && Array.isArray(sub.questions)) {
          sub.questions.forEach(q => {
            allQuestions.push({
              question: q,
              category: relZone.name,
              zone: 'relationship'
            });
          });
        }
      });
    }
  }
  
  // Extract questions from friendship zone
  if (friendshipQuestions.categories && friendshipQuestions.categories[0]) {
    const friendZone = friendshipQuestions.categories[0];
    if (friendZone.subcategories) {
      friendZone.subcategories.forEach(sub => {
        if (sub.questions && Array.isArray(sub.questions)) {
          sub.questions.forEach(q => {
            allQuestions.push({
              question: q,
              category: friendZone.name,
              zone: 'friendship'
            });
          });
        }
      });
    }
  }
  
  // Extract questions from family zone
  if (familyQuestions.categories && familyQuestions.categories[0]) {
    const familyZone = familyQuestions.categories[0];
    if (familyZone.subcategories) {
      familyZone.subcategories.forEach(sub => {
        if (sub.questions && Array.isArray(sub.questions)) {
          sub.questions.forEach(q => {
            allQuestions.push({
              question: q,
              category: familyZone.name,
              zone: 'family'
            });
          });
        }
      });
    }
  }
  
  // Extract questions from emotional zone
  if (emotionalQuestions.categories && emotionalQuestions.categories[0]) {
    const emotionalZone = emotionalQuestions.categories[0];
    if (emotionalZone.subcategories) {
      emotionalZone.subcategories.forEach(sub => {
        if (sub.questions && Array.isArray(sub.questions)) {
          sub.questions.forEach(q => {
            allQuestions.push({
              question: q,
              category: emotionalZone.name,
              zone: 'emotional'
            });
          });
        }
      });
    }
  }
  
  // Extract questions from fun zone
  if (funQuestions.categories && funQuestions.categories[0]) {
    const funZone = funQuestions.categories[0];
    if (funZone.subcategories) {
      funZone.subcategories.forEach(sub => {
        if (sub.questions && Array.isArray(sub.questions)) {
          sub.questions.forEach(q => {
            allQuestions.push({
              question: q,
              category: funZone.name,
              zone: 'fun'
            });
          });
        }
      });
    }
  }
  
  console.log(`Loaded ${allQuestions.length} questions from data files`);
  return allQuestions;
};

// Send daily question reminder with real questions from data (ONCE per day)
exports.sendDailyReminder = functions.pubsub
  .schedule('0 9 * * *') // Daily at 9:00 AM
  .timeZone('America/New_York')
  .onRun(async (context) => {
    try {
      // Check if daily notification already sent today to prevent duplicates
      const today = new Date();
      const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Get all real questions from your data files
      const allQuestions = getAllQuestionsFromData();
      
      if (allQuestions.length === 0) {
        console.log('❌ No questions found in data files');
        return null;
      }
      
      // Get today's question based on date to ensure consistency
      const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
      const questionIndex = dayOfYear % allQuestions.length;
      const selectedQuestion = allQuestions[questionIndex];

      const message = {
        notification: {
          title: '🌅 Daily Question',
          body: selectedQuestion.question,
        },
        topic: 'daily_reminders',
        data: {
          type: 'daily_question',
          question: selectedQuestion.question,
          category: selectedQuestion.category,
          zone: selectedQuestion.zone,
          questionIndex: questionIndex,
          date: today.toISOString(),
          totalQuestions: allQuestions.length,
          sentDate: todayString // Track sent date to prevent duplicates
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
            channelId: 'daily-questions',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              'thread-id': 'daily-questions',
            },
          },
        },
      };

      const response = await admin.messaging().send(message);
      console.log('✅ Daily question sent successfully:', response);
      console.log(`📋 Question ${questionIndex + 1}/${allQuestions.length}: ${selectedQuestion.question}`);
      console.log(`🏷️ Category: ${selectedQuestion.category} (${selectedQuestion.zone})`);
      console.log(`📅 Sent on: ${todayString}`);
      return null;
    } catch (error) {
      console.error('❌ Error sending daily reminder:', error);
      return null;
    }
  });

// Send weekly highlights (ONCE per week)
exports.sendWeeklyHighlights = functions.pubsub
  .schedule('0 10 * * 1') // Monday at 10:00 AM
  .timeZone('America/New_York')
  .onRun(async (context) => {
    try {
      // Check if weekly notification already sent this week to prevent duplicates
      const now = new Date();
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay() + 1)); // Start of current week (Monday)
      const weekString = weekStart.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Get random question for weekly variety from your data files
      const allQuestions = getAllQuestionsFromData();
      
      if (allQuestions.length === 0) {
        console.log('❌ No questions found in data files for weekly highlights');
        return null;
      }
      
      // Pick random question for weekly variety
      const randomIndex = Math.floor(Math.random() * allQuestions.length);
      const weeklyQuestionData = allQuestions[randomIndex];
      
      const message = {
        notification: {
          title: '📊 Weekly Question',
          body: weeklyQuestionData.question,
        },
        topic: 'weekly_highlights',
        data: {
          type: 'weekly_highlights',
          question: weeklyQuestionData.question,
          category: weeklyQuestionData.category,
          zone: weeklyQuestionData.zone,
          questionIndex: randomIndex,
          date: now.toISOString(),
          totalQuestions: allQuestions.length,
          sentDate: weekString // Track sent week to prevent duplicates
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
            channelId: 'weekly-highlights',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              'thread-id': 'weekly-highlights',
            },
          },
        },
      };

      const response = await admin.messaging().send(message);
      console.log('✅ Weekly question sent successfully:', response);
      console.log(`📊 Question ${randomIndex + 1}/${allQuestions.length}: ${weeklyQuestionData.question}`);
      console.log(`🏷️ Category: ${weeklyQuestionData.category} (${weeklyQuestionData.zone})`);
      console.log(`📅 Week of: ${weekString}`);
      return null;
    } catch (error) {
      console.error('❌ Error sending weekly highlights:', error);
      return null;
    }
  });

// Send new category alert (triggered by database changes - ONCE per category)
exports.sendNewCategoryAlert = functions.firestore
  .document('categories/{categoryId}')
  .onCreate(async (snap, context) => {
    try {
      const newCategory = snap.data();
      
      if (!newCategory || !newCategory.name) {
        console.log('❌ Invalid category data:', newCategory);
        return null;
      }
      
      // Check if alert already sent for this category to prevent duplicates
      const categoryId = context.params.categoryId;
      const alertSentKey = `category_alert_${categoryId}`;
      const alertDoc = await admin.firestore().collection('notification_tracking').doc(alertSentKey).get();
      
      if (alertDoc.exists && alertDoc.data().sent) {
        console.log(`⚠️ Alert already sent for category: ${newCategory.name}`);
        return null;
      }
      
      // Mark alert as sent
      await admin.firestore().collection('notification_tracking').doc(alertSentKey).set({
        sent: true,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        categoryName: newCategory.name
      });
      
      const message = {
        notification: {
          title: '🆕 New Category Available!',
          body: `A fresh card category "${newCategory.name}" has been added. Discover new ways to connect!`,
        },
        topic: 'new_category_alerts',
        data: {
          type: 'new_category',
          categoryId: categoryId,
          categoryName: newCategory.name,
          categoryDescription: newCategory.description || '',
          date: new Date().toISOString(),
          alertSentKey: alertSentKey
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
            channelId: 'new-categories',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              'thread-id': 'new-categories',
            },
          },
        },
      };

      const response = await admin.messaging().send(message);
      console.log('✅ New category alert sent successfully:', response);
      console.log(`🆕 Category: ${newCategory.name} (${categoryId})`);
      console.log(`📅 Alert sent at: ${new Date().toISOString()}`);
      return null;
    } catch (error) {
      console.error('❌ Error sending new category alert:', error);
      return null;
    }
  });

// Send two-second quick questions (high frequency)
exports.sendTwoSecondQuestion = functions.pubsub
  .schedule('every 2 minutes') // Firebase minimum interval, will be triggered more frequently from client
  .timeZone('America/New_York')
  .onRun(async (context) => {
    try {
      const questions = [
        "What are you grateful for right now?",
        "Who made you smile today?",
        "What's one thing you learned today?",
        "How can you make someone's day better?",
        "What's something beautiful you noticed today?",
        "Who do you need to connect with?",
        "What's one small victory today?",
        "How are you feeling right now?",
        "What's on your mind?",
        "What would make today great?"
      ];
      
      const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
      
      const message = {
        notification: {
          title: '⚡ Quick Question',
          body: randomQuestion,
        },
        topic: 'two_second_questions',
        data: {
          type: 'two_second_question',
          question: randomQuestion,
          timestamp: new Date().toISOString(),
          continuous: true,
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
            channelId: 'two-second-questions',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              'thread-id': 'two-second-questions',
            },
          },
        },
      };

      const response = await admin.messaging().send(message);
      console.log('Two-second question sent successfully:', response);
      return null;
    } catch (error) {
      console.error('Error sending two-second question:', error);
      return null;
    }
  });

// Send immediate two-second question (callable from client)
exports.sendImmediateTwoSecondQuestion = functions.https.onCall(async (data, context) => {
  try {
    const questions = [
      "What are you grateful for right now?",
      "Who made you smile today?",
      "What's one thing you learned today?",
      "How can you make someone's day better?",
      "What's something beautiful you noticed today?",
      "Who do you need to connect with?",
      "What's one small victory today?",
      "How are you feeling right now?",
      "What's on your mind?",
      "What would make today great?"
    ];
    
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
    
    const message = {
      notification: {
        title: '⚡ Quick Question',
        body: randomQuestion,
      },
      topic: 'two_second_questions',
      data: {
        type: 'two_second_question',
        question: randomQuestion,
        timestamp: new Date().toISOString(),
        immediate: true,
        continuous: true,
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          channelId: 'two-second-questions',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            'thread-id': 'two-second-questions',
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log('Immediate two-second question sent successfully:', response);
    
    return { success: true, messageId: response, question: randomQuestion };
  } catch (error) {
    console.error('Error sending immediate two-second question:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Send custom notification to specific topic
exports.sendCustomNotification = functions.https.onCall(async (data, context) => {
  try {
    const { topic, title, body, notificationData } = data;
    
    if (!topic || !title || !body) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required fields: topic, title, body'
      );
    }

    const message = {
      notification: {
        title,
        body,
      },
      topic,
      data: {
        ...notificationData,
        timestamp: new Date().toISOString(),
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log('Custom notification sent successfully:', response);
    
    return { success: true, messageId: response };
  } catch (error) {
    console.error('Error sending custom notification:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Send notification to specific device
exports.sendToDevice = functions.https.onCall(async (data, context) => {
  try {
    const { token, title, body, notificationData } = data;
    
    if (!token || !title || !body) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required fields: token, title, body'
      );
    }

    const message = {
      notification: {
        title,
        body,
      },
      token,
      data: {
        ...notificationData,
        timestamp: new Date().toISOString(),
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log('Device notification sent successfully:', response);
    
    return { success: true, messageId: response };
  } catch (error) {
    console.error('Error sending device notification:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Subscribe user to topic
exports.subscribeToTopic = functions.https.onCall(async (data, context) => {
  try {
    const { topic, token } = data;
    
    if (!topic || !token) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required fields: topic, token'
      );
    }

    const response = await admin.messaging().subscribeToTopic(token, topic);
    console.log('Successfully subscribed to topic:', response);
    
    return { success: true, response };
  } catch (error) {
    console.error('Error subscribing to topic:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Unsubscribe user from topic
exports.unsubscribeFromTopic = functions.https.onCall(async (data, context) => {
  try {
    const { topic, token } = data;
    
    if (!topic || !token) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required fields: topic, token'
      );
    }

    const response = await admin.messaging().unsubscribeFromTopic(token, topic);
    console.log('Successfully unsubscribed from topic:', response);
    
    return { success: true, response };
  } catch (error) {
    console.error('Error unsubscribing from topic:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
