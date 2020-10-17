export default class Logger {
    constructor(textareaElement) {
        this.textArea=document.getElementById(textareaElement);
    }

    log(text) {
        this.textArea.value+=this.textArea.value+text+"\n";
    }
}