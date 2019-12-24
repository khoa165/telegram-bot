const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const parser = require('./parser.js');
const express = require('express')
const bodyParser = require('body-parser');
const app = express();
require('dotenv').config();

const catPhoto = require('./features/cat_photo.js');
const catFact = require('./features/cat_fact.js');

const token = process.env.TELEGRAM_TOKEN;
let bot;

if (process.env.NODE_ENV === 'production') {
   bot = new TelegramBot(token);
   bot.setWebHook(process.env.HEROKU_URL + bot.token);
} else {
   bot = new TelegramBot(token, { polling: true });
}

// Matches "/word whatever"
bot.onText(/\/word (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const word = match[1];
  axios
    .get(`${process.env.OXFORD_API_URL}/entries/en-gb/${word}`, {
      params: {
        fields: 'definitions',
        strictMatch: 'false'
      },
      headers: {
        app_id: process.env.OXFORD_APP_ID,
        app_key: process.env.OXFORD_APP_KEY
      }
    })
    .then(response => {
      const parsedHtml = parser(response.data);
      bot.sendMessage(chatId, parsedHtml, { parse_mode: 'HTML' });
    })
    .catch(error => {
      const errorText = error.response.status === 404 ? `No definition found for the word: <b>${word}</b>` : `<b>An error occured, please try again later!</b>`;
      bot.sendMessage(chatId, errorText, { parse_mode:'HTML'})
    });
});

bot.onText(/\/send cat photo/, (msg, match) => {
  const chatId = msg.chat.id;
  const photo = catPhoto();
  bot.sendPhoto(chatId, photo, {caption: "A cute cat makes a cute chat!"});
});

bot.onText(/\/send cat fact/, (msg, match) => {
  const chatId = msg.chat.id;
  axios
    .get('https://catfact.ninja/fact')
    .then(response => {
      const fact = catFact(response);
      bot.sendMessage(chatId, fact, { parse_mode: 'HTML' });
    })
    .catch(error => {
      const errorText = '<b>An error occured, please try again later!</b>';
      bot.sendMessage(chatId, errorText, { parse_mode:'HTML'})
    });
});

// Listen for any kind of message.
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Meow meow! Your meow-ssage was received!');
});

app.use(bodyParser.json());

app.listen(process.env.PORT);

app.post('/' + bot.token, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});
