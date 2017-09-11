import Twitter from 'twitter';
import dotenv from 'dotenv';
import Telegraf from 'telegraf';
import schedule from 'node-schedule';

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const telegram = new Telegraf.Telegram(process.env.BOT_TOKEN, {
    agent: null,
    webhookReply: true
});
const client = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});
let lastest_id = undefined;

bot.use(Telegraf.log());
bot.use(Telegraf.memorySession());
bot.startPolling();

// Runs each half hour.
const job = schedule.scheduleJob('00,30 * * * *', () => {
    const serverTime = new Date(Date.now());
    const mal_params = {
        screen_name: 'myanimelist',
        exclude_replies: true,
        include_rts: false,
        since_id: lastest_id
    };

    console.log(`[${serverTime.toString()}] Running content notifications.`);
    client.get('statuses/user_timeline', mal_params, (error, tweets, response) => {
        if (error) console.log(error);

        else {
            tweets.forEach(tweet => {
                telegram.sendMessage(process.env.CHANNEL_ID, tweet.text);
            });

            if(0 !== tweets.length)
                lastest_id = tweets[0].id;
        }
    });
});
