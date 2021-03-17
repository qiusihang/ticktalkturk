var Chatbot = function(taketurn, show_message) {

    this.taketurn = taketurn;
    this.show_message = show_message;

    this.typing_rate = 10; // ms per character
    this.turn_taking = 100; // between-turn pause (ms)

    this.message_queue = [];
    this.utterance = 0;

    this.history = [];

    this.talk = function(text) {
        this.message_queue = text;
        this.utterance += 1;    // turn to a new utterance, ongoing utterance will be stopped
        this.utter(this.utterance, Date.now());
    }

    this.utter = function(utterance, start_time, i = 0) {
        var that = this;
        if ( utterance != that.utterance ) {
            that.onmessage("chatbot", {start_time:start_time,text:"__interruption__"});
            return;  // turn to a new utterance
        }
        if ( that.message_queue == undefined || i >= that.message_queue.length ) return;
        var text = that.message_queue[i];
        if ( text.indexOf("buttons") == 0 || text.indexOf("checkbox") == 0 ) {    // show buttons/checkbox
            that.show_message(text);
            that.utter(utterance, start_time, i+1);
            return;
        }
        options = text.split("|");                  // a reply might have different options, seperated by "|"
        option = options[Math.floor(Math.random()*options.length)]; // randomly select one item from options
        setTimeout(function(){
            that.show_message("loading");
            setTimeout(function(){
                if ( utterance != that.utterance ) {
                    that.onmessage("chatbot", {start_time:start_time,text:"__interruption__"});
                    return;  // turn to a new utterance
                }
                that.onmessage("chatbot", {start_time:start_time,text:option});
                that.utter(utterance, start_time, i+1);
            }, option.length * that.typing_rate > 1000?1000:option.length * that.typing_rate);
        }, this.turn_taking);
    }

    this.send = function(message) { // message here also includes other information like type times and pauses
        this.onmessage("user", message);
        this.taketurn(this, message["text"]);
    }

    this.onmessage = function(person, message) {
        if ( person == "chatbot" ) {
            this.history.push({
                person:     "chatbot",
                start_time: message["start_time"],
                send_time:  Date.now(),
                text:       message["text"].split("<div")[0]
            });
            if ( message["text"] != "__interruption__" ) this.show_message("Chatbot:"+message["text"]);
        } else if ( person == "user" ) {
            this.history.push({
                person:     "user",
                start_time: message["start_time"],
                send_time:  Date.now(),text:message,
                pauses:     message["pauses"],
                keys:       message["keys"],
                text:       message["text"]
            });
            this.show_message("__you__:"+message["text"]);
        }
    }
}
