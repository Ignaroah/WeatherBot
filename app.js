const builder = require('botbuilder');
const restify = require('restify');
const request = require('request');


// Setup Restify Server
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log('%s listening to %s', server.name, server.url)
});

// Create chat connector for commmunicating with the Bot Framework Service
const connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Listen for messages from users
server.post('api/messages',connector.listen());

// Reveive messages from the user and respond by echoing each message back (prefixed with 'You said:')
const bot = new builder.UniversalBot(connector,[(session) =>{

    session.send("Welcome to the bot");

    if ((session.message.text == 'hello') || (session.message.text == 'hi')){
        session.beginDialog("askForConfirmation");
    };

    /*
    request('http://www.google.com',(error,response,body) => {
        session.send(body);
    })
    */
    },
    (session, results) => {
        session.send("%s", results.response)
        session.endDialog();
    }
]);

bot.dialog('askForConfirmation', [
    function (session){
        builder.Prompts.text(session, "Hi there! Do you want the weather for your location?")
        //Send a Card to the user
    },
    function (session, results){
        session.endDialogWithResult(results)
    }
])