// Generated by CoffeeScript 2.5.1
(function() {
  var Twitter, fs, getTweets, main;

  fs = require('fs');

  Twitter = require('twitter');

  getTweets = function(twitterClient, screenName, max_id) {
    return new Promise(function(resolve, reject) {
      var twitterParams;
      twitterParams = {
        screen_name: screenName,
        count: 200
      };
      if (max_id != null) {
        twitterParams.max_id = max_id;
      }
      return twitterClient.get('statuses/user_timeline', twitterParams, function(error, tweets, response) {
        if (error != null) {
          return reject(error);
        } else {
          return resolve(tweets);
        }
      });
    });
  };

  main = async function(argv) {
    var config, configFilename, i, lastTweet, len, oldestID, outputFilename, screenName, tweet, tweetLink, tweetLinks, tweets, twitterClient;
    if (argv.length < 3) {
      console.log("tweets [config file] [screen name] [output file]");
      return;
    }
    configFilename = argv[0];
    screenName = argv[1];
    outputFilename = argv[2];
    config = JSON.parse(fs.readFileSync(configFilename, "utf8"));
    if ((config.consumer_key == null) || (config.consumer_secret == null) || (config.access_token_key == null) || (config.access_token_secret == null)) {
      console.log("Config requires: consumer_key, consumer_secret, access_token_key, access_token_secret");
      return;
    }
    console.log("Config:");
    console.log(JSON.stringify(config, null, 2));
    console.log(`Screen Name: ${screenName}`);
    console.log(`Output     : ${outputFilename}`);
    twitterClient = new Twitter(config);
    tweetLinks = [];
    oldestID = null;
    while (true) {
      tweets = (await getTweets(twitterClient, screenName, oldestID));
      if (tweets.length === 0) {
        break;
      }
      console.log(`First ID: ${tweets[0].id}`);
      console.log(`Last  ID: ${tweets[tweets.length - 1].id}`);
      for (i = 0, len = tweets.length; i < len; i++) {
        tweet = tweets[i];
        if (tweet.id === oldestID) {
          continue;
        }
        if (tweet.retweeted) {
          continue;
        }
        if (tweet.in_reply_to_user_id != null) {
          continue;
        }
        tweetLink = `https://twitter.com/${screenName}/status/${tweet.id_str}`;
        tweetLinks.push(tweetLink);
      }
      console.log(`Got ${tweets.length} tweets...`);
      fs.writeFileSync(`debug_${oldestID}.json`, JSON.stringify(tweets, null, 2));
      lastTweet = tweets[tweets.length - 1];
      oldestID = lastTweet.id;
    }
    fs.writeFileSync(outputFilename, tweetLinks.join("\n"));
    return console.log(`Wrote: ${outputFilename}`);
  };

  module.exports = main;

}).call(this);