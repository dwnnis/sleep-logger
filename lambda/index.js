/* *
 * This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
 * Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
 * session persistence, api calls, and more.
 * */
const Alexa = require('ask-sdk-core');

// data structure for storing sleep log
const sleepLog = {};

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = `Welcome to sleep logger. I'm here to help you log your sleep and retrieve sleep logs from the past. If you'd like to start logging sleep for a certain day, let me know which day that was, when you fell asleep, and when you awoke at that day.`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const RequestLogSleepIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'RequestLogSleepIntent';
    },
    handle(handlerInput) {
        const date = handlerInput.requestEnvelope.request.intent.slots.date.value;
        const asleepTime = handlerInput.requestEnvelope.request.intent.slots.asleepTime.value;
        const wakeTime = handlerInput.requestEnvelope.request.intent.slots.awakeTime.value;
        
        sleepLog[date] = [asleepTime, wakeTime];

        const speakOutput = `Okay, I logged your sleep from ${date}. You fall asleep at ${asleepTime} and get up at ${wakeTime}.`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

const RequestLogSleepDurationIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'RequestLogSleepDurationIntent';
    },
    handle(handlerInput) {
        const date = handlerInput.requestEnvelope.request.intent.slots.date.value;
        const asleepTime = handlerInput.requestEnvelope.request.intent.slots.asleepTime.value;
        const duration = handlerInput.requestEnvelope.request.intent.slots.duration.value; 
        
        // add handling storing, and convert to wake time.
        var converted_duration = getDuration(duration);
        var converted_time = asleepTime.split(":");
        var time = parseInt(converted_time[0]) * 60 + parseInt(converted_time[1]) + converted_duration;
        var day = Math.floor(time/1440);
        var result_hour = Math.floor((time - (1440 * day)) / 60);
        var result_min = time % 60;
        var result_wake_time = result_hour.toString() + ":" + result_min.toString();
        
        sleepLog[date] = [asleepTime, result_wake_time];
        
        const speakOutput = `Okay, I logged your sleep from ${date}. You fall asleep at ${asleepTime} and wake up at ${result_wake_time}.`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
}

const RequestAllSleepLogIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'RequestAllSleepLogIntent';
    },
    handle(handlerInput) {
        // retrieve all sleep log and merge them all into a long string.
        var allSleepLog = ``;
        for (var date in sleepLog) {
            allSleepLog += `On ${date}, you fall asleep at ${sleepLog[date][0]} and got up at ${sleepLog[date][1]}. `
        }
        
        const speakOutput = `Okay, here's all the sleep logs you have:` + allSleepLog;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }   
}

const RequestSleepTimeIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'RequestSleepTimeIntent';
    },
    handle(handlerInput) {
        const date = handlerInput.requestEnvelope.request.intent.slots.date.value;
        
        const speakOutput = `You went to bed at ${sleepLog[date][0]}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }  
}

const RequestWakeTimeIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'RequestWakeTimeIntent';
    },
    handle(handlerInput) {
        const date = handlerInput.requestEnvelope.request.intent.slots.date.value;
        
        const speakOutput = `You woke up at ${sleepLog[date][1]}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }  
    
}

const RequestSleepLogFromSleepTimeIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'RequestSleepLogFromSleepTimeIntent';
    },
    handle(handlerInput) {
        const date = handlerInput.requestEnvelope.request.intent.slots.date.value;
        
        var durationHour;
        var durationMin;
        var asleepTime = sleepLog[date][0];
        var wakeTime = sleepLog[date][1];
        var asleepRawTime = asleepTime.split(":");
        var wakeRawTime = wakeTime.split(":");
        var asleepRawTimeInDay = parseInt(asleepRawTime[0]) * 60 + parseInt(asleepRawTime[1]);
        var wakeRawTimeInDay = parseInt(wakeRawTime[0]) * 60 + parseInt(wakeRawTime[1]);
        if (asleepRawTimeInDay < wakeRawTimeInDay) {
            durationHour = Math.floor((wakeRawTimeInDay - asleepRawTimeInDay)/60);
            durationMin = (wakeRawTimeInDay - asleepRawTimeInDay) % 60
        } else {
            durationHour = Math.floor((1440 - asleepRawTimeInDay + wakeRawTimeInDay)/60);
            durationMin = (1440 - asleepRawTimeInDay + wakeRawTimeInDay) % 60;
        }
        
        const speakOutput = `You slept for ${durationHour} hours and ${durationMin} minutes on ${date}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    } 
}

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'You can say hello to me! How can I help?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};
/* *
 * FallbackIntent triggers when a customer says something that doesn’t map to any intents in your skill
 * It must also be defined in the language model (if the locale supports it)
 * This handler can be safely added but will be ingnored in locales that do not support it yet 
 * */
const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Sorry, I don\'t know about that. Please try again.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
/* *
 * SessionEndedRequest notifies that a session was ended. This handler will be triggered when a currently open 
 * session is closed for one of the following reasons: 1) The user says "exit" or "quit". 2) The user does not 
 * respond or says something that does not match an intent defined in your voice model. 3) An error occurs 
 * */
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse(); // notice we send an empty response
    }
};
/* *
 * The intent reflector is used for interaction model testing and debugging.
 * It will simply repeat the intent the user said. You can create custom handlers for your intents 
 * by defining them above, then also adding them to the request handler chain below 
 * */
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};
/**
 * Generic error handling to capture any syntax or routing errors. If you receive an error
 * stating the request handler chain is not found, you have not implemented a handler for
 * the intent being invoked or included it in the skill builder below 
 * */
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const speakOutput = 'Sorry, I had trouble doing what you asked. Please try again.';
        console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

/**
 * External Functions
 * */
function getDuration(amazon_duration) {
    // source: https://stackoverflow.com/questions/35810418/add-amazon-duration-to-current-time/35822875
    let timelist = amazon_duration.match(/([S]?\d+)/gim);
    let duration = 0;
    if (timelist.length === 1) {
        duration = parseInt(timelist[0]) * 1;
    } else if (timelist.length === 2) {
        duration = (parseInt(timelist[0]) * 60) + (parseInt(timelist[1]) * 1);
    } else if (timelist.length === 3) {
        duration = (parseInt(timelist[0]) * 60 * 60) + (parseInt(timelist[1]) * 60) + (parseInt(timelist[2]) * 1);
    }

    return duration;
}




/**
 * This handler acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom 
 * */
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        RequestLogSleepIntentHandler,
        RequestLogSleepDurationIntentHandler,
        RequestAllSleepLogIntentHandler,
        RequestSleepTimeIntentHandler,
        RequestWakeTimeIntentHandler,
        RequestSleepLogFromSleepTimeIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler)
    .addErrorHandlers(
        ErrorHandler)
    .withCustomUserAgent('sample/hello-world/v1.2')
    .lambda();