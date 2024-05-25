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
  await client.replyMessage(events.replyToken, {
    type: "text",
    text: "Hello World!!!",
  });
  res.status(200).send();
});
