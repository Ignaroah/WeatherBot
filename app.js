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

// Reveive messages from the user
const bot = new builder.UniversalBot(connector,[(session) =>{

    if ((session.message.text.toLowerCase() == 'hello') || (session.message.text.toLowerCase() == 'hi')){
        // Begin the waterfall process to get the weather
        session.beginDialog('saidGreeting');
    }else{
        // Default message 
        session.send("Welcome to the weather bot! Just say 'hi' or 'hello' to get started.");
    };
   
    }
]);

// Main dialog that begins the Waterfall process triggered from either 'hello','hi' or 'cancel'
bot.dialog('saidGreeting', [
    function (session,args){

        // A reprompt when there is a callback from an invalid entry
        if(args && args.reprompt){
            builder.Prompts.text(session, "Sorry I could not understand that. I can understand either yes or no.")
        }
        else{
            builder.Prompts.text(session, "Hi there! Do you want the weather for a location?");

            // Send a confirm card to the user
            sendConfirm(session);
        }
    },

    // Redirect the waterfall on users input
    function (session, results){
        if (results.response.toLowerCase() === 'yes'){

            // Advances waterfall to ask for users desired location
            session.beginDialog('askedLocation');
        }
        else if(results.response.toLowerCase() === 'no'){

            session.endDialog("No problem, call on me if you need me!");
        }
        else{

            // Loop back to prompt user to place a valid input
            session.replaceDialog('saidGreeting', {reprompt:true});
        }
        
    },
    function (session, results){
        session.endDialog("No problem, call on me if you need me!")
    }
]).triggerAction(
    {
        matches:/^(hello|hi|cancel)$/i
    }
)

bot.dialog('askedLocation', [
    function(session){
        // Prompt for the users location
        builder.Prompts.text(session, "Where do you want the weather from?");
    },
    function(session,results){
        session.userData.location = results.response;
        const uri = "http://api.openweathermap.org/data/2.5/weather?q=" + results.response + "&units=metric&APPID=e65f5155260314d2e0e15def5dee3cca";

        // Use request to find the location through the OpenWeatherMap API
        request(uri,(error,response,body) => {
            if (!error && response.statusCode === 200) {
                const res = JSON.parse(body);
                session.send ("It is %d°C and %s in %s.", res.main.temp , res.weather[0].description, res.name);
                builder.Prompts.text(session, "Did you want the weather elsewhere?");
                sendConfirm(session);
            } 
            else {
                console.log("Got an error: ", error, ", status code: ", response.statusCode)
                session.send("Sorry, I couldnt find the weather there.")
                builder.Prompts.text(session, "Did you want the weather elsewhere?");
                sendConfirm(session);
            }
        })  
    },
    function(session, results){
        if (results.response.toLowerCase() === 'yes'){
            session.replaceDialog('askedLocation');
        }
        else if(results.response.toLowerCase() === 'no'){
            session.endDialog()
        }
        else{
            session.send("Sorry I could not understand that. I can understand either yes or no.")
            session.replaceDialog('askedLocation')
        }
    }
]);

// Creates a HeroCard with 2 buttons to confirm and then sends it to the user
const sendConfirm = session => {
        var msg = new builder.Message(session);
        msg.attachmentLayout(builder.AttachmentLayout.carousel)
        msg.attachments([
            new builder.HeroCard(session)
                .buttons([
                    builder.CardAction.imBack(session, "yes", "Yes"),
                    builder.CardAction.imBack(session, "no", "No")
        ]),
    ]);
    session.send(msg)
}
