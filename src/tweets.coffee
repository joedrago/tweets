fs = require 'fs'
Twitter = require 'twitter'

getTweets = (twitterClient, screenName, max_id) ->
  return new Promise (resolve, reject) ->
    twitterParams =
      screen_name: screenName
      count: 200
    if max_id?
      twitterParams.max_id = max_id
    twitterClient.get 'statuses/user_timeline', twitterParams, (error, tweets, response) ->
      if error?
        reject(error)
      else
        resolve(tweets)

main = (argv) ->
  if argv.length < 3
    console.log "tweets [config file] [screen name] [output file]"
    return

  configFilename = argv[0]
  screenName = argv[1]
  outputFilename = argv[2]
  mediaOnly = (argv.length > 3)

  config = JSON.parse(fs.readFileSync(configFilename, "utf8"))
  if not config.consumer_key? or not config.consumer_secret? or not config.access_token_key? or not config.access_token_secret?
    console.log "Config requires: consumer_key, consumer_secret, access_token_key, access_token_secret"
    return

  console.log "Config:"
  console.log JSON.stringify(config, null, 2)
  console.log "Screen Name: #{screenName}"
  console.log "Output     : #{outputFilename}"

  twitterClient = new Twitter(config)

  tweetLinks = []
  oldestID = null
  loop
    tweets = await getTweets(twitterClient, screenName, oldestID)
    if tweets.length == 0
      break

    if (tweets.length == 1) and tweets[0].id == oldestID
      break

    for tweet in tweets
      if tweet.id == oldestID
        continue
      if tweet.retweeted
        continue
      if tweet.in_reply_to_user_id?
        continue
      if mediaOnly
        if tweet.entities? and tweet.entities.media? and (tweet.entities.media.length > 0) and tweet.entities.media[0].media_url?
          media = tweet.entities.media[0]
          if media.media_url.match(/video_thumb/)
            tweetLink = media.expanded_url
          else
            tweetLink = media.media_url
        else
          continue
      else
        tweetLink = "https://twitter.com/#{screenName}/status/#{tweet.id_str}"
      tweetLinks.push tweetLink

    console.log "Got #{tweets.length} tweets..."

    # fs.writeFileSync("debug_#{oldestID}.json", JSON.stringify(tweets, null, 2))

    lastTweet = tweets[tweets.length - 1]
    oldestID = lastTweet.id

  fs.writeFileSync(outputFilename, tweetLinks.join("\n"))
  console.log "Wrote: #{outputFilename}"

module.exports = main
