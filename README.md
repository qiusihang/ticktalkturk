# TickTalkTurk
TickTalkTurk: Conversational Crowdsourcing Made Easy [DEMO](https://qiusihang.github.io/ticktalkturk/index.html)

![logo](logo.png)

- The workflow of [conversational microtask crowdsourcing](https://qiusihang.github.io/files/publications/chi2020_worker_engagement.pdf) is defined in `./js/ticktalkturk.js` (*taketurn* function).

- The examples of crowdsourcing tasks are in the folder `./tasks/captcha/`.

## Usage

You can use the following code to deploy conversational crowdsourcing tasks on the *Design Layout* page. You can also find the code in `index.html`, which is an example HIT (human intelligence task) for Amazon's Mechanical Turk.

```
<script src="https://assets.crowd.aws/crowd-html-elements.js"></script>

<crowd-form answer-format="flatten-objects" style="position:absolute;top:5px;left:20px;right:20px;bottom:10px">

<div id="container" style="display:none;">
    <div id="history-container">
        <table id="chat-history">
        </table>
    </div>
    <div id="message-container">
        <textarea id="message" name="message" onkeydown="onKeyDown(event)" placeholder="Type your message here"></textarea>
    </div>
    <div id="send-button" onclick="click_send()">SEND</div>
    <div id="message-cover">Please reply the chatbot by selecting an option.</div>
    <div id="submit">
        <crowd-button form-action="submit">Submit HIT</crowd-button>
    </div>
    <textarea id="chat-answers" name="chat-answers" style="display:none"></textarea>
</div>

</crowd-form>

<script src="https://qiusihang.github.io/ticktalkturk/js/chatbot.js"></script>
<script src="https://qiusihang.github.io/ticktalkturk/js/ticktalkturk.js"></script>
<script>

    var chatbot = new Chatbot(taketurn); // taketurn is a callback function defined in ticktalkturk.js

    window.onload = function() {
        // document.getElementById("message").focus();
        var task = document.createElement("script");
        task.src = "https://qiusihang.github.io/ticktalkturk/tasks/captcha/task1.js";
        document.body.appendChild(task);
        task.onload = start_task;  // start is an initialization function defined in ticktalkturk.js

        // load CSS file
        var head = document.getElementsByTagName("head")[0];
        var style = document.createElement("link");
        style.rel = "stylesheet";
        style.type = "text/css";
        style.media = "all";
        style.href = "https://qiusihang.github.io/ticktalkturk/style/client.css";
        head.appendChild(style);
        style.onload = function() {
            document.getElementById("container").style.display = "block";
        }
    }

    document.querySelector('crowd-form').onsubmit = function(e) {
        if ( document.getElementById("answers").value == "" ) {
            e.preventDefault();
        }
    };
</script>
```
