const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

// Send daily question reminder
exports.sendDailyReminder = functions.pubsub
  .schedule('0 9 * * *') // Daily at 9:00 AM
  .timeZone('America/New_York')
  .onRun(async (context) => {
    try {
      const message = {
        notification: {
          title: 'Daily Question',
          body: 'Your daily question is ready! Take a moment to reflect and connect.',
        },
        topic: 'daily_reminders',
        data: {
          type: 'daily_question',
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
      console.log('Daily reminder sent successfully:', response);
      return null;
    } catch (error) {
      console.error('Error sending daily reminder:', error);
      return null;
    }
  });

// Send weekly highlights
exports.sendWeeklyHighlights = functions.pubsub
  .schedule('0 10 * * 1') // Monday at 10:00 AM
  .timeZone('America/New_York')
  .onRun(async (context) => {
    try {
      const message = {
        notification: {
          title: 'Weekly Highlights',
          body: 'Catch up on your favorite moments from this week. Tap to explore!',
        },
        topic: 'weekly_highlights',
        data: {
          type: 'weekly_highlights',
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
      console.log('Weekly highlights sent successfully:', response);
      return null;
    } catch (error) {
      console.error('Error sending weekly highlights:', error);
      return null;
    }
  });

// Send new category alert (triggered by database changes)
exports.sendNewCategoryAlert = functions.firestore
  .document('categories/{categoryId}')
  .onCreate(async (snap, context) => {
    try {
      const newCategory = snap.data();
      
      const message = {
        notification: {
          title: 'New Category Available!',
          body: `A fresh card category "${newCategory.name}" has been added. Discover new ways to connect!`,
        },
        topic: 'new_category_alerts',
        data: {
          type: 'new_category',
          categoryId: context.params.categoryId,
          categoryName: newCategory.name,
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
      console.log('New category alert sent successfully:', response);
      return null;
    } catch (error) {
      console.error('Error sending new category alert:', error);
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
