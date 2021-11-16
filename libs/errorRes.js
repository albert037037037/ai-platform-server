class ErrorRes extends Error {
  constructor(code, message, status = 400) {
    let messageString = '';
    if (typeof message === 'object') {
      messageString = message.message || JSON.stringify(message);
    } else {
      messageString = message;
    }
    super(messageString);

    this.code = code;
    this.message = messageString;
    this.status = status;
  }
}

export default ErrorRes;
