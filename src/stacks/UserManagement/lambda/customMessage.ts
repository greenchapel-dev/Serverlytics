// This function overrides the default messages sent by cognito

export async function main( event: any) {

  // override the default message sent by Cognito for SignUp
  if (event.triggerSource === 'CustomMessage_SignUp') {
    const message = `Thank you for signing up. Your confirmation code is ${event.request.codeParameter}.`;
    event.response.emailMessage = message; // set the email body
    event.response.emailSubject = `Welcome to ${process.env.COGNITO_FROM_NAME}`; // set the email subject
  }
  return event;

}

