'use strict';

var _twitter = require('twitter');

var _twitter2 = _interopRequireDefault(_twitter);

var _dotenv = require('dotenv');

var _dotenv2 = _interopRequireDefault(_dotenv);

var _telegraf = require('telegraf');

var _telegraf2 = _interopRequireDefault(_telegraf);

var _nodeSchedule = require('node-schedule');

var _nodeSchedule2 = _interopRequireDefault(_nodeSchedule);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_dotenv2.default.config();

const bot = new _telegraf2.default(process.env.BOT_TOKEN);
const telegram = new _telegraf2.default.Telegram(process.env.BOT_TOKEN, {
    agent: null,
    webhookReply: true
});
const client = new _twitter2.default({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});
let lastest_id = undefined;

bot.use(_telegraf2.default.log());
bot.use(_telegraf2.default.memorySession());
bot.startPolling();

// Runs each half hour.
const job = _nodeSchedule2.default.scheduleJob('00,30 * * * *', () => {
    const serverTime = new Date(Date.now());
    const mal_params = {
        screen_name: 'myanimelist',
        exclude_replies: true,
        include_rts: false,
        since_id: lastest_id
    };

    console.log(`[${serverTime.toString()}] Running content notifications.`);
    client.get('statuses/user_timeline', mal_params, (error, tweets, response) => {
        if (error) console.log(error);else {
            tweets.forEach(tweet => {
                telegram.sendMessage(process.env.CHANNEL_ID, tweet.text);
            });

            if (0 !== tweets.length) lastest_id = tweets[0].id;
        }
    });
});