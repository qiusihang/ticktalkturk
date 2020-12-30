
var Chatbot = function(element, taketurn, show_message = bubble) {
    element.innerHTML = chatbot_elements;

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
        if ( text.indexOf("buttons") == 0 ) {    // show buttons
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
                text:       message["text"]
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
};

var chatbot_elements = "<div id=\"container\" style=\"display:none;\">\
    <div id=\"history-container\"><table id=\"chat-history\"></table></div>\
    <div id=\"message-container\"><textarea id=\"message\" name=\"message\" onkeydown=\"onKeyDown(event)\" placeholder=\"Type your message here\"></textarea></div>\
    <div id=\"send-button\" onclick=\"click_send()\">SEND</div>\
    <div id=\"message-cover\">Please reply the chatbot by selecting an option.</div>\
    <div id=\"submit\"><crowd-button form-action=\"submit\">Submit HIT</crowd-button></div>\
    <textarea id=\"chat-answers\" name=\"chat-answers\" style=\"display:none\"></textarea></div>";

var start_time = 0;
var last_time = 0;
var pauses = [];
var keys = [];

var send = function(text) {
    var utterance = {
        start_time: start_time,
        pauses:     pauses,
        keys:       keys,
        text:       text
    };
    chatbot.send(utterance);
    // clean the statistical data
    start_time = 0;
    last_time = 0;
    pauses = [];
    keys = [];
}

var loading_cell = document.createElement("div");

var loading = function() {              // show loading animation
    if ( loading_cell.parentElement != undefined ) loading_cell.parentElement.style = "display:none";
    var row = document.getElementById("chat-history").insertRow();
    loading_cell = row.insertCell();
    loading_cell.innerHTML = "<div class=\"lds-ellipsis\"><div></div><div></div><div></div><div></div></div>";
    to_bottom();
}

var buttons_cell = document.createElement("div");

var buttons = function(message) {       // show buttons
    if ( buttons_cell.parentElement != undefined ) buttons_cell.parentElement.style = "display:none";
    var row = document.getElementById("chat-history").insertRow();
    buttons_cell = row.insertCell();
    var str = "<div style=\"width:100%;text-align:center;\">";
    var btns = message.substring(message.indexOf('#'),message.length).split('#');
    btns.forEach(function(e,i) {
        var param = encodeURIComponent(e).replace(/'/g, "%27");
        if (e.length > 0) str += "<div class=\"button\" onclick=\"select_button(\'"+param+"\')\">"+e.split('%')[0]+"</div>";  // show message, remove comment
    });
    buttons_cell.innerHTML = str + "</div>";
    if ( message.indexOf("buttons-only") == 0 ) {
        document.getElementById("message-cover").style.display = "block";   // disable textarea
        document.getElementById("message").disabled = true;
    }
    to_bottom();
}

var bubble = function(message) {
    // if the message is "loading", show loading animation
    // if the message starts with "buttons", show buttons
    // if the message does not include ":", show the message as a notification
    // if the message includes ":", then it as a conversation bubble, the substring before ":" is the username

    if ( message == undefined || message.length == undefined ) return;
    if ( message == "loading" ) {
        loading();
        return;
    }
    if ( message.indexOf("buttons") == 0 ) {
        buttons(message);
        return;
    }
    if ( loading_cell.parentElement != undefined ) loading_cell.parentElement.style = "display:none";
    var row = document.getElementById("chat-history").insertRow();
    var cell = row.insertCell();
    cell.innerHTML = bubble_content(message);
    to_bottom();
}

var user_image = "https://qiusihang.github.io/ticktalkturk/res/default.png";
var chatbot_image = "https://qiusihang.github.io/ticktalkturk/res/andrea.png";
var profile_image = function(username) {
    if ( username == "__you__") {
        var img = "<div style=\"float:right\" class=\"profile-image\"><img class=\"user-image\" height=\"100%\" src=\""+user_image+"\" />";
        // img += "<div class=\"profile-image-charac\"></div>";
        img += "</div>";
        return img;
    } else {
        return "<div style=\"float:left\" class=\"profile-image\"><img height=\"100%\" src=\""+chatbot_image+"\"/></div>";
    }
}

var bubble_content = function(message) {
    var i = message.indexOf(":");
    if ( i < 0 )
        return "<div class=\"notification\"><p>" + message + "</p></div>";
    var t = new Date();
    var username = message.substring(0,i);
    var result = "";
    if (username != "__you__") {
        if ( !(typeof chatbot_name === 'undefined') ) username = chatbot_name;
        result = "<span style=\"font-size:10px;color:#999999;\">" + username + "  ";  // show username
    } else {
        result = "<span style=\"font-size:10px;color:#d9d9d9;\">"
    }
    result += ("0" + t.getHours()).slice(-2) + ":" + ("0" + t.getMinutes()).slice(-2) + "</span><br/>"; // show time hh:mm

    var message_content = message.substring(i+1,message.length);
    if (message_content.indexOf("RAW:") == 0) {
        result += message_content.replace("RAW:",""); // raw message, keep comment
    } else {
        result += message_content.split('%')[0]; // show message, remove comment
    }
    if (username == "__you__")
        result = profile_image(username)+"<div class=\"right-arrow\"></div><div class=\"bubble-me\">" + result + "</div>";  // user's bubble
    else
        result = profile_image(username)+"<div class=\"left-arrow\"></div><div class=\"bubble\">" + result + "</div>";      // other's bubble
    return result;
}

var click_send = function() {
    var m = document.getElementById("message");
    if ( m.value == "" ) return;
    if ( m.value.length > 5000 ) {
        alert("Your message is too long!");
        return;
    }
    count();
    send(m.value);
    m.value = "";
    if ( buttons_cell.parentElement != undefined ) buttons_cell.parentElement.style = "display:none";
    document.getElementById("message-cover").style.display = "none";   // enable textarea
    document.getElementById("message").disabled = false;
    // if (!window.mobileAndTabletCheck())
    m.focus();
}

var select_button = function(text) {
    text = decodeURIComponent(text);
    count();
    send(text);
    if ( buttons_cell.parentElement != undefined ) buttons_cell.parentElement.style = "display:none";
    document.getElementById("message-cover").style.display = "none";   // enable textarea
    document.getElementById("message").disabled = false;
    var m = document.getElementById("message");
    m.value = "";
    // if (!window.mobileAndTabletCheck())
    m.focus();
}

var count = function(keyCode=13) {
    // Doing some statistical things here: Counting pauses, typing times...
    var current_time = Date.now();
    if ( start_time == 0 ) {
        start_time = current_time;
        pauses.push(0);  // count pauses
        keys.push(keyCode);
    }else {
        pauses.push(current_time - last_time);  // count pauses
        keys.push(keyCode);
    }
    last_time = current_time;
}

var to_bottom = function() {
    var div = document.getElementById("history-container");
    div.scrollTop = div.scrollHeight;   // go to the bottom
}

var onKeyDown = function(e) {
    e = e || window.event;
    count(e.keyCode);
    if (e.keyCode == 13 && e.shiftKey) {
        return;
    }
    if (e.keyCode == 13) {
        e.returnValue = false;
        click_send();
    }
}

window.mobileAndTabletCheck = function() {
  let check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
};

function parse_query_string() {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    var query_string = {};
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        var key = decodeURIComponent(pair[0]);
        var value = decodeURIComponent(pair[1]);
        if (typeof query_string[key] === "undefined") {
            query_string[key] = decodeURIComponent(value);
        } else if (typeof query_string[key] === "string") {
            var arr = [query_string[key], decodeURIComponent(value)];
            query_string[key] = arr;
        } else {
            query_string[key].push(decodeURIComponent(value));
        }
    }
    return query_string;
}
