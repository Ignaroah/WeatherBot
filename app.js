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

    //Default message
    

    //Find Users intent

    if ((session.message.text.toLowerCase() == 'hello') || (session.message.text.toLowerCase() == 'hi')){
        //Clear userData
        session.beginDialog('saidGreeting');
    }else{
        session.send("Welcome to the bot");
    };
   


    /*
    request('http://www.google.com',(error,response,body) => {
        session.send(body);
    })
    */
    }
]);

bot.dialog('saidGreeting', [
    function (session,args){
        if(args && args.reprompt){
            builder.Prompts.text(session, "Sorry I could not understand that. I can understand either yes or no.")
        }
        else{
            builder.Prompts.text(session, "Hi there! Do you want the weather for your location?");
        }
        //Send a Card to the user
    },
    function (session, results){
        if (results.response.toLowerCase() == "yes"){
            session.beginDialog('askedLocation');
        }
        else if(results.response.toLowerCase() == "no"){
            session.endDialog("No problem, call on me if you need me!");
        }
        else{
            session.replaceDialog('saidGreeting', {reprompt:true});
        }
        
    },
    function (session, results){
        session.endDialog("No problem, call on me if you need me!")
        //sompething
    }
]).triggerAction(
    {
        matches:/^(hello|hi)$/i
    }
)

bot.dialog('askedLocation', [
    function(session){
        builder.Prompts.text(session, "Where do you want your location to be?");
    },
    function(session,results){
        session.userData.location = results.response;
        const uri = "http://api.openweathermap.org/data/2.5/weather?q=" + results.response + "&units=metric&APPID=e65f5155260314d2e0e15def5dee3cca";

        request(uri,(error,response,body) => {
            if (!error && response.statusCode === 200) {
                const res = JSON.parse(body);
                session.send ("It is %d°C and %s in %s", res.main.temp.toFixed(1) , res.weather[0].description, res.name);
                builder.Prompts.text(session, "Did you want weather elsewhere?");
            } 
            else {
                console.log("Got an error: ", error, ", status code: ", response.statusCode)
                session.send("Sorry, I couldnt find the weather there.")
                builder.Prompts.text(session, "Did you want weather elsewhere?");
            }
        })

        
    },
    function(session, results){
        if (results.response.toLowerCase() == 'yes'){
            session.replaceDialog('askedLocation');
        }
        else if(results.response.toLowerCase() == 'no'){
            session.endDialog()
        }
        else{
            session.send("Sorry I could not understand that. I can understand either yes or no.")
            session.replaceDialog('askedLocation')
        }
    }
])
