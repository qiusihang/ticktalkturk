# TickTalkTurk
**TickTalkTurk: Conversational Crowdsourcing Made Easy** ([PDF](https://qiusihang.github.io/files/publications/cscw2020demo.pdf)).
*Sihang Qiu, Ujwal Gadiraju, and Alessandro Bozzon.*
CSCW 2020 Demonstration.

```tex
@inproceedings{qiu2020ticktalkturk,
  title={TickTalkTurk: Conversational Crowdsourcing Made Easy},
  author={Qiu, Sihang and Gadiraju, Ujwal and Bozzon, Alessandro},
  booktitle={Conference Companion Publication of the 2020 on Computer Supported Cooperative Work and Social Computing},
  pages={1--5},
  year={2020}
}
```

![logo](logo.png)

- If you want to create a chatbot for online surveys/tasks, please visit this [PAGE](https://qiusihang.github.io/ticktalkturk) for chatbot settings.

- The workflow of [conversational microtask crowdsourcing](https://qiusihang.github.io/files/publications/chi2020_worker_engagement.pdf) is defined in `./js/client.js` (complex task workflow can be customized here).

- Download the code of the previous version [HERE](https://qiusihang.github.io/ticktalkturk/v1.zip).

## Explanation

- An **utterance** is a message shown in a speech bubble (speech balloon) from either the chatbot or the user.

- Currently, an **utterance** of the chatbot can be of 4 types, i.e. text, image, radio buttons, and checkboxes.

- The user can give a response (i.e. an **utterance**) by either using text input (at the bottom of the UI) or using interactive **utterances** (i.e. buttons or checkboxes) sent by the chatbot.

- A conversational **turn** starts with an **utterance** of the chatbot, and ends with an **utterance** of the user (as a response to chatbot).

- The **utterance** of the user can be validated using some keywords or phrases. If a keyword/phrase provided is found in the user's **utterance**, the conversation proceeds to the next **turn**. Otherwise, the user will be asked to provide a valid response.

- Each **turn** has at least one chatbot's **utterance** and only one user's **utterance**.

- A **conversation** consists of **turn**(s), and it has at least one **turn**.
