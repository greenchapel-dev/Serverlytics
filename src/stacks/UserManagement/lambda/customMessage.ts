

export async function main( event: any) {

  if (event.triggerSource === 'CustomMessage_SignUp') {
    const message = `Thank you for signing up. Your confirmation code is ${event.request.codeParameter}.`;
    // event.response.smsMessage = message;
    event.response.emailMessage = message;
    event.response.emailSubject = `Welcome to ${process.env.COGNITO_FROM_NAME}`;
  }
  return event;

}

