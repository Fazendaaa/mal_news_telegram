import Twitter from 'twitter';
import dotenv from 'dotenv';
import Telegraf from 'telegraf';
import schedule from 'node-schedule';
import fs from 'fs';

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

bot.use(Telegraf.log());
bot.use(Telegraf.memorySession());
bot.startPolling();

const updateMal = mal => {
    const updated = JSON.stringify(mal, null, '\t');

    fs.writeFile('./mal.json', updated, (err, data) => {
        if(err)
            console.log(err);
    });
}

new Promise((resolve, reject) => {
    fs.readFile('./mal.json', (err, data) => {
        if (err)
            console.log(err)
        else
            resolve(JSON.parse(data));
    })
}).then(data => {
    let mal_params = data;
    // Runs each half hour.
    const job = schedule.scheduleJob('00,30 * * * *', () => {
        const serverTime = new Date(Date.now());

        console.log(`[${serverTime.toString()}] Running content notifications.`);
        client.get('statuses/user_timeline', mal_params, (error, tweets, response) => {
            if (error)
                console.log(error);
    
            else if (0 !== tweets.length) {
                tweets.forEach(tweet => {
                    telegram.sendMessage(process.env.CHANNEL_ID, tweet.text);
                });
    
                // Save the lastest id so, that way, when the bot crashes and need it to reboot it wont fetch all the way though the data when starts up again
                mal_params.since_id = tweets[0].id;
                updateMal(mal_params);
            }
        });
    });
});
