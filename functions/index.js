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

exports.webHook = functions.https.onRequest(async (req, res) => {
  const events = req.body.events[0];
  const userId = events.source.userId;
  const userMessage = events.message.text;

  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      // 新規ユーザーの場合
      await userRef.set({ state: 'normal' });
      await client.replyMessage(events.replyToken, {
        type: 'text',
        text: 'はじめまして！新規リストを作成するには、「新規作成」と入力してください。',
      });
    } else {
      // 既存ユーザーの場合
      const userData = userDoc.data();

      switch (userData.state) {
        case 'normal':
          switch (userMessage) {
            case '新規作成':
              await userRef.update({ state: 'waiting_for_list_name' });
              await client.replyMessage(events.replyToken, {
                type: 'text',
                text: 'リスト名を入力してください。',
              });
              break;
            case 'データ入力':
              await userRef.update({ state: 'waiting_for_data_input' });
              const lists = await getUserLists(userId);
              await replyListsMessage(events.replyToken, lists);
              break;
            case 'リスト一覧':
              const userLists = await getUserLists(userId);
              await replyListsMessage(events.replyToken, userLists);
              break;
            default:
              await client.replyMessage(events.replyToken, {
                type: 'text',
                text: '「新規作成」、「データ入力」、「リスト一覧」のいずれかを選択してください。',
              });
              break;
          }
          break;
        case 'waiting_for_list_name':
          // リスト名の入力待ちモードの処理を追加
          break;
        case 'waiting_for_data_input':
          // データ入力待ちモードの処理を追加
          break;
        default:
          await userRef.update({ state: 'normal' });
          await client.replyMessage(events.replyToken, {
            type: 'text',
            text: 'エラーが発生しました。通常モードに戻ります。',
          });
          break;
      }
    }

    res.status(200).send();
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send();
  }
  res.status(200).send();
});
