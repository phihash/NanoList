'use strict';

const functions = require('firebase-functions');
const line = require('@line/bot-sdk');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

const config = {
  channelAccessToken: functions.config().linebot.access_token,
  channelSecret: functions.config().linebot.secret,
};

const client = new line.Client(config);

// ユーザーのリスト一覧を取得する関数

exports.webHook = functions.https.onRequest(async (req, res) => {
  const events = req.body.events[0];
  const userId = events.source.userId;
  const userMessage = events.message.text;
  const userRef = db.collection('users').doc(userId);

  try {
    if(userMessage == "取得"){
      const messagesSnapshot = await userRef.collection('messages').orderBy('timestamp').get();
      const messages = messagesSnapshot.docs.map(doc => doc.data().message);

      // メッセージをユーザーに送り返す
      const replyMessage = {
        type: 'text',
        text: `あなたの保存したデータ:\n${messages.join('\n')}`
      };

      await client.replyMessage(events.replyToken, replyMessage);
      return;
    }

    //保存
    await userRef.collection('messages').add({
      message: userMessage,
      timestamp: new Date() ,
    });


  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send();
  }

  res.status(200).send();
});
