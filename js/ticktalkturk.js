var answers = [];
var text_unsure = ["Sorry, I don\'t get it.|Sorry, what do you mean?|Sorry, I don\'t understand."];
var edit_intro = false; // if the introduction of how to edit a question has been give
var review_process = false; // if the worker has already reviewed the answers at least once
var optional_questions = false; // if at least one optional question has been shown up
var task_stopped = false; // if the task has been terminated
var current_conv = "start"; // name of current conversation
var question_id = 0; // ID of current question
var max_question_id = 0; // ID of the last pushed question
var id_offset = 0;  // ID of the first question

var conversation = {
    "start": [
        "Hey! I'm Andrea. could you please help me with a task called <b>__TASK_NAME__</b>?",
        "I think you want to see the task instructions, right?",
        "buttons-only:#Yes, I want to see the task instructions.%[yes]#No, I don\'t.%[no]"
    ],
    "instructions": [
        "Good. I think you now understand how to complete tasks. Shall we move on?"
    ],
    "first_question": [
        "Look. The first question."
    ],
    "next_question": [
        "The next one."
    ],
    "edit_question": [
        "By the way, if you want to edit the answer of the previous question, please type &quot;<i>edit answer</i>&quot;."
    ],
    "previous_question": [
        "Here you go."
    ],
    "wrong_answer": [
        "Sorry, I don\'t understand your answer. If you forget how to answer the question, please type &quot;<i>instruction</i>&quot;."
    ],
    "optional": [
        "Nice. The mandatory part of this task has been done. Do you want to do more? No worries, you'll get paid.",
        "You can stop the task anytime by typing \"<i>stop task</i>\".",
        "buttons-only:#I want to continue.%[continue]#I want to stop now.%[stop]#"
    ],
    "break": [
        "If you are feeling tired (or the task is too difficult), you can type \"<i>stop task</i>\" to stop anytime. No worries, you'll get paid.",
        "buttons-only:#I want to continue.%[continue]#I want to stop now.%[stop]#"
    ],
    "review": [
        "You have completed the task. Please check your answers: __ANSWER__",
        "Do you want to proceed to answer submission?",
        "buttons-only:#Yes, I want to submit my answers.%[yes]#No, I want to edit my answers.%[no]#"
    ],
    "edit": [
        "Alright. Which answer you want to edit?",
        "Please type its question number."
    ],
    "bye": [
        "OK. Thank you for your participation.",
        "Bye!"
    ]
};

var strip = function(text) {
    return text.toLowerCase().replace(/[\s.,\/#!$%\^&\*;:{}=\-_'"`~()]/g, "");
}

var start_task = function() {
    // load CSS file
    var head = document.getElementsByTagName("head")[0];
    var style = document.createElement("link");
    style.rel = "stylesheet";
    style.type = "text/css";
    style.media = "all";
    style.href = "https://qiusihang.github.io/ticktalkturk/style/client.css";
    // style.href = "./style/client.css";
    head.appendChild(style);
    style.onload = function() {
        document.getElementById("container").style.display = "block";
        conversation["start"][0] = conversation["start"][0].replace("__TASK_NAME__",task["name"]);
        chatbot.talk(conversation["start"]);
    }
};

var taketurn = function(chatbot, message) {
    // this callback function is used for processing users message and then decide how chatbot should reply.
    // you should use function chatbot.talk(["text1","text2"]) to reply.

    switch (current_conv) {
        case "start":
            if ( message.includes("[yes]") ) {
                chatbot.talk(task["instruction"].concat(conversation["instructions"]));
                current_conv = "instructions";
            } else if ( message.includes("[no]") ) {
                push_question(chatbot);
                current_conv = "question";
            } else {
                chatbot.talk(text_unsure.concat([
                    "I think you want to see the task instructions, right?",
                    "buttons-only:#Yes, I want to see the task instructions.%[yes]#No, I don\'t.%[no]"
                ]));
            }
            break;
        case "instructions":
            if (max_question_id > 0) max_question_id--;
            push_question(chatbot);
            break;
        case "question":
            if (!review_process && max_question_id > 1 && strip(message).includes("edit")) {
                max_question_id--;
                question_id = max_question_id;
                chatbot.talk(get_question(1));
                break;
            }
            if ( optional_questions && strip(message).includes("stop")) {
                stop_task(chatbot);
                break;
            }
            if ( strip(message).includes("instruction")) {
                chatbot.talk(conversation["instructions"]);
                current_conv = "instructions";
                break;
            }
            if ( !task.validate(message) ) {
                chatbot.talk(get_question(2));
                break;
            }
            answers[question_id-1] = message;
            push_question(chatbot);
            break;
        case "optional":
        case "break":
            if ( message.includes("[continue]") ) {
                if ( current_conv=="break" ) {chatbot.talk(get_question());current_conv="question";}
                else push_question(chatbot);
            }
            else if ( message.includes("[stop]") ) stop_task(chatbot);
            else chatbot.talk(text_unsure.concat(conversation[current_conv]));
            break;
        case "edit":
            var qid = parseInt(message.toLowerCase().replace("q", ""));
            if (0 < qid && qid <= max_question_id) {
                question_id = qid;
                chatbot.talk(get_question(1));
                current_conv = "question";
            } else {
                chatbot.talk(text_unsure.concat(get_review()));
                current_conv = "review";
            }
            break;
        case "review":
            if ( message.includes("[yes]") ) {
                chatbot.talk(conversation["bye"]);
                current_conv = "bye";
                document.getElementById("submit").style.display = "block";
                document.getElementById("message").disabled = true;
                document.getElementById("chat-answers").value = JSON.stringify(answers);
            } else if ( message.includes("[no]") ) {
                chatbot.talk(conversation["edit"]);
                current_conv = "edit";
            } else {
                chatbot.talk(text_unsure.concat(get_review()));
            }
            break;
        case "bye":
            break;
        default:
            chatbot.talk(text_unsure);
    }

};

var get_question = function(condition = 0) { //0:normal, 1:edit, 2:invalid
    var question = [];
    switch (condition) {
        case 1:
            question = question.concat(conversation["previous_question"]);
            break;
        case 2:
            question = question.concat(conversation["wrong_answer"]);
            break;
        default:
            question = question.concat(conversation["next_question"]);
            if (question_id == 2 && !edit_intro) {
                question = question.concat(conversation["edit_question"]);
                edit_intro = true;
            }
            if (question_id == 1) Object.assign(question, conversation["first_question"]);
    }
    // get content about question
    var qid = (question_id + id_offset - 1) % task.questions.length + 1;
    task["questions"][qid - 1]["question"].forEach(function(e, i) {
        if (!i) question.push("<b>Q" + question_id + ":</b> " + e);
        else question.push(e);
    });
    return question;
}

var push_question = function(chatbot) {
    if (max_question_id >= task.questions.length || task_stopped) {
        chatbot.talk(get_review());
        current_conv = "review";
        return;
    }
    if ( !optional_questions && max_question_id == task.question_number) {
        optional_questions = true;
        chatbot.talk(conversation["optional"]);
        current_conv = "optional";
        return;
    }
    max_question_id += 1;
    question_id = max_question_id;

    if ( max_question_id > 1 && max_question_id % 10 == 1 ) {
        chatbot.talk(conversation["break"]);
        current_conv = "break";
    } else {
        chatbot.talk(get_question());
        current_conv = "question";
    }
}

var stop_task = function(chatbot) {
    if (typeof answers[max_question_id-1] === "undefined") max_question_id -= 1;
    task_stopped = true;
    push_question(chatbot);
}

var get_review = function() {
    var ans_string = "";
    review_process = true;
    for (var i = 0; i < max_question_id; i++)
        ans_string += "<br/><b>Q" + (i + 1) + ":</b> " + answers[i];
    var review = conversation["review"];
    for ( var i = 0 ; i < review.length ; i ++ )
        review[i] = review[i].replace("__ANSWER__",ans_string);
    return review;
}
